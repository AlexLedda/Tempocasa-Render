import requests
import sys
import json
from datetime import datetime
import time

class Vision3DAPITester:
    def __init__(self, base_url="https://floorcraft3d.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"
        self.conversation_id = None
        self.floor_plan_id = None

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = response.text

            if success:
                self.log_test(name, True, f"Status: {response.status_code}", response_data)
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response_data}")

            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)
    
    def test_create_floorplan(self):
        """Test creating a floor plan"""
        data = {
            "user_id": self.user_id,
            "name": "Test Floor Plan",
            "file_type": "image"
        }
        success, response = self.run_test("Create FloorPlan", "POST", "floorplans", 200, data)
        if success and response:
            self.floor_plan_id = response.get('id')
        return success

    def test_get_floorplans(self):
        """Test getting floor plans"""
        return self.run_test("Get FloorPlans", "GET", f"floorplans?user_id={self.user_id}", 200)

    def test_get_floorplan_by_id(self):
        """Test getting specific floor plan"""
        if not self.floor_plan_id:
            self.log_test("Get FloorPlan by ID", False, "No floor plan ID available")
            return False
        return self.run_test("Get FloorPlan by ID", "GET", f"floorplans/{self.floor_plan_id}", 200)

    def test_update_floorplan(self):
        """Test updating floor plan"""
        if not self.floor_plan_id:
            self.log_test("Update FloorPlan", False, "No floor plan ID available")
            return False
        
        data = {"name": "Updated Test Floor Plan"}
        return self.run_test("Update FloorPlan", "PATCH", f"floorplans/{self.floor_plan_id}", 200, data)

    def test_upload_image(self):
        """Test image upload to Cloudinary"""
        if not self.floor_plan_id:
            self.log_test("Upload Image", False, "No floor plan ID available")
            return False
        
        # Create a simple test image file
        import io
        from PIL import Image
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test_image.png', img_bytes, 'image/png')}
        
        url = f"{self.api_url}/floorplans/{self.floor_plan_id}/upload"
        print(f"\n🔍 Testing Upload Image...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files)
            success = response.status_code == 200
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            if success:
                # Check if response contains file_url
                if isinstance(response_data, dict) and 'file_url' in response_data:
                    self.log_test("Upload Image", True, f"Status: {response.status_code}, URL returned: {response_data.get('file_url', 'N/A')}", response_data)
                else:
                    self.log_test("Upload Image", False, f"No file_url in response: {response_data}")
                    success = False
            else:
                self.log_test("Upload Image", False, f"Expected 200, got {response.status_code}. Response: {response_data}")
            
            return success
            
        except Exception as e:
            self.log_test("Upload Image", False, f"Exception: {str(e)}")
            return False

    def test_convert_3d(self):
        """Test 3D conversion"""
        if not self.floor_plan_id:
            self.log_test("Convert to 3D", False, "No floor plan ID available")
            return False
        
        return self.run_test("Convert to 3D", "POST", f"floorplans/{self.floor_plan_id}/convert-3d", 200)

    def test_create_conversation(self):
        """Test creating conversation"""
        data = {
            "user_id": self.user_id,
            "title": "Test Conversation"
        }
        success, response = self.run_test("Create Conversation", "POST", "conversations", 200, data)
        if success and response:
            self.conversation_id = response.get('id')
        return success

    def test_get_conversations(self):
        """Test getting conversations"""
        return self.run_test("Get Conversations", "GET", f"conversations?user_id={self.user_id}", 200)

    def test_chat_gpt5(self):
        """Test chat with GPT-5"""
        if not self.conversation_id:
            self.log_test("Chat GPT-5", False, "No conversation ID available")
            return False
        
        data = {
            "conversation_id": self.conversation_id,
            "message": "Ciao, puoi aiutarmi con il design 3D?",
            "model": "gpt-5"
        }
        return self.run_test("Chat GPT-5", "POST", "chat", 200, data)

    def test_chat_claude(self):
        """Test chat with Claude Sonnet 4"""
        if not self.conversation_id:
            self.log_test("Chat Claude", False, "No conversation ID available")
            return False
        
        data = {
            "conversation_id": self.conversation_id,
            "message": "Come posso migliorare il rendering 3D?",
            "model": "claude-4-sonnet-20250514"
        }
        return self.run_test("Chat Claude", "POST", "chat", 200, data)

    def test_get_messages(self):
        """Test getting messages"""
        if not self.conversation_id:
            self.log_test("Get Messages", False, "No conversation ID available")
            return False
        
        return self.run_test("Get Messages", "GET", f"conversations/{self.conversation_id}/messages", 200)

    def test_user_preferences(self):
        """Test user preferences"""
        # Get preferences (should create default if not exists)
        success1, _ = self.run_test("Get User Preferences", "GET", f"preferences/{self.user_id}", 200)
        
        # Update preferences
        data = {
            "preferred_model": "claude-4-sonnet-20250514",
            "render_quality": "medium",
            "default_wall_height": 3.0
        }
        success2, _ = self.run_test("Update User Preferences", "PATCH", f"preferences/{self.user_id}", 200, data)
        
        return success1 and success2

    def test_feedback(self):
        """Test feedback system"""
        data = {
            "user_id": self.user_id,
            "floor_plan_id": self.floor_plan_id,
            "feedback_type": "suggestion",
            "content": "Il rendering potrebbe essere più realistico",
            "rating": 4
        }
        success1, _ = self.run_test("Create Feedback", "POST", "feedback", 200, data)
        
        success2, _ = self.run_test("Get Feedback", "GET", f"feedback?user_id={self.user_id}", 200)
        
        return success1 and success2

    def test_render(self):
        """Test render endpoint"""
        if not self.floor_plan_id:
            self.log_test("Render", False, "No floor plan ID available")
            return False
        
        data = {
            "floor_plan_id": self.floor_plan_id,
            "quality": "high",
            "style": "realistic"
        }
        return self.run_test("Render", "POST", "render", 200, data)

    def test_delete_floorplan(self):
        """Test deleting floor plan"""
        if not self.floor_plan_id:
            self.log_test("Delete FloorPlan", False, "No floor plan ID available")
            return False
        
        return self.run_test("Delete FloorPlan", "DELETE", f"floorplans/{self.floor_plan_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Vision3D API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print(f"   Test User ID: {self.user_id}")
        
        # Basic API tests
        self.test_api_root()
        self.test_health_check()
        
        # FloorPlan tests
        self.test_create_floorplan()
        self.test_get_floorplans()
        self.test_get_floorplan_by_id()
        self.test_update_floorplan()
        self.test_upload_image()
        self.test_convert_3d()
        
        # Chat tests
        self.test_create_conversation()
        self.test_get_conversations()
        
        # AI Chat tests (these might take longer)
        print("\n⏳ Testing AI integrations (may take a few seconds)...")
        self.test_chat_gpt5()
        time.sleep(2)  # Wait between AI calls
        self.test_chat_claude()
        self.test_get_messages()
        
        # User preferences and feedback
        self.test_user_preferences()
        self.test_feedback()
        
        # Render test
        self.test_render()
        
        # Cleanup
        self.test_delete_floorplan()
        
        # Print results
        print(f"\n📊 Test Results:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = Vision3DAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())