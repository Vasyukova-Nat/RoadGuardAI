import pytest
from unittest.mock import patch, MagicMock
from fastapi import UploadFile
from io import BytesIO
import sys
from app.services.image_service import ImageService

class MockMagic: # мок для импорта библ. python-magic
    def from_buffer(self, *args, **kwargs):
        return 'image/jpeg'

sys.modules['magic'] = MockMagic()

class TestImageServiceUnit:
    """Модульные тесты ImageService (с моками)"""

    @pytest.fixture
    def mock_db(self):
        return MagicMock()

    @pytest.fixture
    def image_service(self, mock_db):
        return ImageService(mock_db)

    def test_validate_file_valid_jpeg(self, image_service):
        """Проверка валидации JPEG файла"""
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'image/jpeg'
        mock_file.file = BytesIO(b'fake_image_data' * 1000)
        image_service.validate_file(mock_file) # должно пройти без исключения

    def test_validate_file_invalid_type(self, image_service):
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'text/plain'

        with pytest.raises(Exception) as exc_info:
            image_service.validate_file(mock_file)
        assert "Неподдерживаемый тип файла" in exc_info.value.detail

class TestImageServiceIntegration:
    """Интеграционные тесты ImageService (с реальной БД)"""

    @pytest.fixture
    def db_session(self, db):
        return db

    @pytest.fixture
    def image_service(self, db_session):
        return ImageService(db_session)

    @pytest.mark.asyncio
    async def test_upload_image_success(self, image_service, test_problem, test_user):
        """Успешная загрузка изображения"""
        file_content = b'fake_image_data' * 1000
        real_file = BytesIO(file_content)
        
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'image/jpeg'
        mock_file.filename = 'test.jpg'
        mock_file.size = len(file_content)
        mock_file.file = real_file # настраиваем file как реальный
        
        async def async_read(size=-1): # Делаем read асинхронным
            return real_file.read(size)
        mock_file.read = async_read 
        mock_file.seek = real_file.seek

        with patch('app.services.image_service.minio_client.upload_file') as mock_upload:
            mock_upload.return_value = 'problems/1/test.jpg'

            result = await image_service.upload_image(
                problem_id=test_problem.id,
                file=mock_file,
                user_id=test_user.id
            )

            assert result['id'] is not None
            assert result['filename'] == 'test.jpg'
            assert result['size'] == len(file_content)

    def test_get_images_for_problem_empty(self, image_service, test_problem):
        """Получение изображений для проблемы без фото"""
        result = image_service.get_images_for_problem(test_problem.id)
        assert result == []

    def test_get_images_for_problem_with_images(self, image_service, test_problem):
        """Получение изображений для проблемы с фото"""
        from app.models.models import ProblemImage
        image = ProblemImage(
            problem_id=test_problem.id,
            file_key='problems/1/test.jpg',
            original_filename='test.jpg',
            file_size=1024,
            content_type='image/jpeg',
            uploaded_by=1
        )
        image_service.image_repo.db.add(image)
        image_service.image_repo.db.commit()
        
        with patch('app.services.image_service.minio_client.get_presigned_url') as mock_url:
            mock_url.return_value = 'http://localhost:9000/test.jpg'
            
            result = image_service.get_images_for_problem(test_problem.id)
            
            assert len(result) == 1
            assert result[0]['original_filename'] == 'test.jpg'
            assert result[0]['file_size'] == 1024

class TestImageServiceEdgeCases:
    """Граничные случаи и ошибки валидации"""
    @pytest.fixture
    def db_session(self, db):
        return db

    @pytest.fixture
    def image_service(self, db_session):
        return ImageService(db_session)

    @pytest.mark.asyncio
    async def test_upload_image_nonexistent_problem(self, image_service, test_user):
        """Загрузка фото для несуществующей проблемы"""
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'image/jpeg'
        mock_file.filename = 'test.jpg'
        
        with pytest.raises(Exception) as exc_info:
            await image_service.upload_image(
                problem_id=99999,
                file=mock_file,
                user_id=test_user.id
            )
        assert "не найдена" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_upload_image_minio_error(self, image_service, test_problem, test_user):
        """Ошибка MinIO при загрузке"""
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'image/jpeg'
        mock_file.filename = 'test.jpg'
        mock_file.file = BytesIO(b'fake_image_data' * 1000)
        
        with patch('app.services.image_service.minio_client.upload_file') as mock_upload:
            mock_upload.return_value = None
            
            with pytest.raises(Exception) as exc_info:
                await image_service.upload_image(
                    problem_id=test_problem.id,
                    file=mock_file,
                    user_id=test_user.id
                )
            assert "Ошибка загрузки" in str(exc_info.value.detail)

    def test_validate_file_empty_content(self, image_service):
        """Валидация пустого файла"""
        mock_file = MagicMock(spec=UploadFile)
        mock_file.content_type = 'image/jpeg'
        mock_file.file = BytesIO(b'')
        
        # Должно пройти проверку типа, но размер будет 0. Это граничный случай
        try:
            image_service.validate_file(mock_file)
        except Exception as e:
            pytest.fail(f"validate_file вызвал исключение: {e}")