from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from ..core.minio_client import minio_client
from ..repositories.image_repo import ImageRepository
from ..repositories.problem_repo import ProblemRepository
import magic

ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] # Константы для валидации
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

class ImageService:
    def __init__(self, db: Session):
        self.image_repo = ImageRepository(db)
        self.problem_repo = ProblemRepository(db)
    
    def validate_file(self, file: UploadFile): # Проверяет файл на соответствие огран-ям
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_TYPES)}"
            )
        
        content = file.file.read(1024) # Проверка размера (читаем часть)
        file.file.seek(0)  # возвр указатель в начало
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Файл слишком большой. Максимум {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        
        # Проверка реального типа файла через magic
        try:
            mime = magic.from_buffer(content, mime=True)
            if mime not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail="Файл повреждён или имеет неверный формат"
                )
        except Exception as e:
            print(f"Ошибка определения MIME: {e}")
            # Если magic не сработал, доверяем content_type
    
    async def upload_image(
        self,
        problem_id: int,
        file: UploadFile,
        user_id: int
    ) -> dict:
        """Загружает изображение в MinIO и сохраняет запись в БД"""
        problem = self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Проблема не найдена")

        self.validate_file(file)
        
        content = await file.read() # читает весь файл
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Файл слишком большой. Максимум {MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        
        file_key = minio_client.upload_file( # загружает в MinIO
            file_content=content,
            problem_id=problem_id,
            filename=file.filename,
            content_type=file.content_type,
            metadata={
                'uploaded_by': str(user_id)
            }
        )
        
        if not file_key:
            raise HTTPException(
                status_code=500,
                detail="Ошибка загрузки файла в хранилище"
            )
        
        # запись в БД
        db_image = self.image_repo.create(
            problem_id=problem_id,
            file_key=file_key,
            original_filename=file.filename,
            file_size=len(content),
            content_type=file.content_type,
            uploaded_by=user_id
        )
        
        url = minio_client.get_presigned_url(file_key) # временная ссылка для ответа
        
        return {
            'id': db_image.id,
            'url': url,
            'filename': file.filename,
            'size': len(content)
        }
    
    def get_images_for_problem(self, problem_id: int) -> list:
        """Получает все изображения проблемы с временными ссылками"""
        images = self.image_repo.get_by_problem(problem_id)
        
        result = []
        for img in images:
            url = minio_client.get_presigned_url(img.file_key, expires_in=3600)
            result.append({
                'id': img.id,
                'url': url,
                'original_filename': img.original_filename,
                'file_size': img.file_size,
                'content_type': img.content_type,
                'uploaded_at': img.uploaded_at.isoformat() if img.uploaded_at else None,
                'uploaded_by': img.uploaded_by
            })
        
        return result
    
    def delete_image(self, image_id: int, user_id: int, is_admin: bool) -> dict:
        """Удаляет изображение (проверка прав внутри)"""
        image = self.image_repo.get_by_id(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Изображение не найдено")
        
        if image.uploaded_by != user_id and not is_admin:
            raise HTTPException(status_code=403, detail="Недостаточно прав для удаления")
        
        if not minio_client.delete_file(image.file_key):
            raise HTTPException(status_code=500, detail="Ошибка удаления файла из хранилища")
        
        self.image_repo.delete(image_id) # удал. запись из БД
        
        return {"message": "Файл успешно удалён"}
    
    def delete_all_problem_images(self, problem_id: int) -> int:
        """Удаляет все изображения проблемы (без проверки прав, для каскадного удаления)"""
        images = self.image_repo.get_by_problem(problem_id)
        count = 0
        
        for img in images:
            if minio_client.delete_file(img.file_key):
                count += 1
        
        self.image_repo.delete_by_problem(problem_id)
        
        return count