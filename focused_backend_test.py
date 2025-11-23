import requests
import sys
import json
from datetime import datetime
import time
from PIL import Image
import io

class FloorPlanAPITester:
    def __init__(self, base_url="https://floorplan-vision.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"
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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
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

    def test_scenario(self):
        """Run the complete test scenario as requested"""
        print("🚀 Starting Vision3D Floor Plan API Test Scenario")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print(f"   Test User ID: {self.user_id}")
        
        # 1. Health check (API Root since no health endpoint exists)
        print("\n📋 STEP 1: Health Check")
        success, _ = self.run_test("API Root (Health Check)", "GET", "", 200)
        if not success:
            return False
        
        # 2. Create a new floor plan
        print("\n📋 STEP 2: Create Floor Plan")
        data = {
            "user_id": self.user_id,
            "name": "Test Floor Plan API",
            "file_type": "image"
        }
        success, response = self.run_test("Create Floor Plan", "POST", "floorplans", 200, data)
        if success and response:
            self.floor_plan_id = response.get('id')
            print(f"   Created Floor Plan ID: {self.floor_plan_id}")
        else:
            return False
        
        # 3. Upload a mock image
        print("\n📋 STEP 3: Upload Mock Image")
        img = Image.new('RGB', (200, 200), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test_floorplan.png', img_bytes, 'image/png')}
        
        url = f"{self.api_url}/floorplans/{self.floor_plan_id}/upload"
        print(f"🔍 Testing Upload Image...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files)
            success = response.status_code == 200
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            if success and isinstance(response_data, dict) and 'file_url' in response_data:
                self.log_test("Upload Image", True, f"Status: {response.status_code}, URL: {response_data.get('file_url', 'N/A')}", response_data)
                print(f"   Uploaded to: {response_data.get('file_url')}")
            else:
                self.log_test("Upload Image", False, f"Expected 200 with file_url, got {response.status_code}. Response: {response_data}")
                return False
                
        except Exception as e:
            self.log_test("Upload Image", False, f"Exception: {str(e)}")
            return False
        
        # 4. Get list of floor plans
        print("\n📋 STEP 4: Get Floor Plans List")
        success, response = self.run_test("Get Floor Plans", "GET", f"floorplans?user_id={self.user_id}", 200)
        if not success:
            return False
        
        # 5. Update floor plan with 3D data (walls, rooms, doors)
        print("\n📋 STEP 5: Update Floor Plan with 3D Data")
        three_d_data = {
            "walls": [
                {"start": [0, 0], "end": [5, 0], "height": 2.8, "thickness": 0.2},
                {"start": [5, 0], "end": [5, 4], "height": 2.8, "thickness": 0.2},
                {"start": [5, 4], "end": [0, 4], "height": 2.8, "thickness": 0.2},
                {"start": [0, 4], "end": [0, 0], "height": 2.8, "thickness": 0.2}
            ],
            "rooms": [
                {"id": "room1", "type": "living", "width": 5, "depth": 4, "height": 2.8, "x": 0, "y": 0},
                {"id": "room2", "type": "kitchen", "width": 3, "depth": 2, "height": 2.8, "x": 5, "y": 0}
            ],
            "doors": [
                {"position": [2.5, 0], "width": 0.9, "height": 2.1, "type": "standard"},
                {"position": [5, 2], "width": 0.8, "height": 2.1, "type": "internal"}
            ]
        }
        
        update_data = {
            "three_d_data": json.dumps(three_d_data),
            "status": "ready"
        }
        success, _ = self.run_test("Update Floor Plan with 3D Data", "PATCH", f"floorplans/{self.floor_plan_id}", 200, update_data)
        if not success:
            return False
        
        # 6. Get updated single floor plan
        print("\n📋 STEP 6: Get Updated Floor Plan")
        success, response = self.run_test("Get Single Floor Plan", "GET", f"floorplans/{self.floor_plan_id}", 200)
        if success and response:
            # Verify 3D data is present
            if response.get('three_d_data'):
                print(f"   ✅ 3D data confirmed in response")
            else:
                print(f"   ⚠️  No 3D data found in response")
        else:
            return False
        
        # 7. Delete floor plan
        print("\n📋 STEP 7: Delete Floor Plan")
        success, _ = self.run_test("Delete Floor Plan", "DELETE", f"floorplans/{self.floor_plan_id}", 200)
        if not success:
            return False
        
        return True

    def run_all_tests(self):
        """Run the complete test scenario"""
        success = self.test_scenario()
        
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
        else:
            print(f"\n🎉 All Floor Plan APIs working correctly!")
        
        return success

def main():
    tester = FloorPlanAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())