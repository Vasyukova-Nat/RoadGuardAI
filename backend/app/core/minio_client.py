import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import uuid
from datetime import datetime
from typing import Optional
import os

class MinIOClient:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
        self.access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
        self.secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
        self.bucket_name = os.getenv("MINIO_BUCKET", "roadguard-ai")

        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}  
            ),
            region_name='us-east-1'
        )
        
        self._ensure_bucket_exists() # проверяем и создаём бакет
    
    def _ensure_bucket_exists(self): # создает пакет если его нет
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            print(f"Бакет {self.bucket_name} уже существует")
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    print(f"Бакет {self.bucket_name} создан")
                except ClientError as create_error:
                    print(f"Ошибка создания бакета: {create_error}")
            else:
                print(f"Ошибка проверки бакета: {e}")
    
    def generate_file_key(self, problem_id: int, filename: str) -> str: # путь для файла
        clean_filename = "".join(c for c in filename if c.isalnum() or c in '._-')
        ext = clean_filename.split('.')[-1] if '.' in clean_filename else 'bin'
        unique_name = f"{uuid.uuid4()}.{ext}"
        key = f"problems/{problem_id}/{unique_name}"
        return key
    
    def upload_file( # загружает файл в MinIO и возвращает его ключ
        self, 
        file_content: bytes, 
        problem_id: int, 
        filename: str, 
        content_type: str,
        metadata: Optional[dict] = None
    ) -> Optional[str]:
        try:
            file_key = self.generate_file_key(problem_id, filename)

            if metadata is None:
                metadata = {}
            metadata.update({
                'original_filename': filename,
                'problem_id': str(problem_id),
                'uploaded_at': datetime.now().isoformat()
            })
            
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=content_type,
                Metadata=metadata
            )
            print(f"Файл загружен: {file_key}")
            return file_key
        except ClientError as e:
            print(f"Ошибка загрузки файла: {e}")
            return None
    
    def get_presigned_url(self, file_key: str, expires_in: int = 3600) -> Optional[str]:
        """Генерирует временную ссылку для скачивания"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key
                },
                ExpiresIn=expires_in
            )
            return url
        except ClientError:
            return None
    
    def delete_file(self, file_key: str) -> bool: # из MinIO
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
        except ClientError:
            return False
    
    def get_file_info(self, file_key: str) -> Optional[dict]:
        try:
            response = self.client.head_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return {
                'size': response['ContentLength'],
                'content_type': response['ContentType'],
                'metadata': response.get('Metadata', {}),
                'last_modified': response['LastModified']
            }
        except ClientError:
            return None

try:
    minio_client = MinIOClient()
    print("MinIO клиент успешно создан")
except Exception as e:
    print(f"Ошибка создания MinIO клиента: {e}")
    minio_client = None