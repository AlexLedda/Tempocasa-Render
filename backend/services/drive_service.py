import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

logger = logging.getLogger(__name__)

class DriveService:
    SCOPES = ['https://www.googleapis.com/auth/drive']
    
    def __init__(self, credentials_file: str = 'credentials.json'):
        self.creds = None
        self.service = None
        self.credentials_file = credentials_file
        self._authenticate()

    def _authenticate(self):
        """Authenticates with Google Drive API using Service Account."""
        if os.path.exists(self.credentials_file):
            try:
                self.creds = service_account.Credentials.from_service_account_file(
                    self.credentials_file, scopes=self.SCOPES)
                self.service = build('drive', 'v3', credentials=self.creds)
                logger.info("Successfully authenticated with Google Drive.")
            except Exception as e:
                logger.error(f"Failed to authenticate with Google Drive: {e}")
        else:
            logger.warning(f"Google Drive credentials file '{self.credentials_file}' not found. Drive integration disabled.")

    def create_folder(self, folder_name: str, parent_id: str = None) -> str:
        """Creates a folder on Google Drive and returns its ID."""
        if not self.service:
            logger.warning("Drive service not initialized. Cannot create folder.")
            return None

        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                file_metadata['parents'] = [parent_id]

            file = self.service.files().create(body=file_metadata, fields='id').execute()
            logger.info(f"Created folder '{folder_name}' with ID: {file.get('id')}")
            return file.get('id')
        except Exception as e:
            logger.error(f"Error creating folder '{folder_name}': {e}")
            return None

    def upload_file(self, file_path: str, folder_id: str = None, mime_type: str = None) -> str:
        """Uploads a file to Google Drive."""
        if not self.service:
            logger.warning("Drive service not initialized. Cannot upload file.")
            return None
        
        if not os.path.exists(file_path):
            logger.error(f"File to upload not found: {file_path}")
            return None

        try:
            file_name = os.path.basename(file_path)
            file_metadata = {'name': file_name}
            if folder_id:
                file_metadata['parents'] = [folder_id]

            media = MediaFileUpload(file_path, mimetype=mime_type)
            
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            logger.info(f"Uploaded file '{file_name}' to Drive with ID: {file.get('id')}")
            return file.get('id')
        except Exception as e:
            logger.error(f"Error uploading file '{file_path}': {e}")
            return None

    def find_folder(self, folder_name: str, parent_id: str = None) -> str:
        """Finds a folder by name, optionally within a parent folder. Returns first match ID."""
        if not self.service:
            return None

        try:
            query = f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false"
            if parent_id:
                query += f" and '{parent_id}' in parents"
            
            results = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
            files = results.get('files', [])
            
            if files:
                return files[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error finding folder '{folder_name}': {e}")
            return None
