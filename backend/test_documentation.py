#!/usr/bin/env python3
"""
Test Documentation - Task 2.3
Verify all documentation files exist and have proper content
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent
DOCS_DIR = BASE_DIR / "docs"

# Required documentation files
REQUIRED_DOCS = {
    "API_SECURITY_GUIDE.md": {
        "min_size": 10000,  # bytes
        "required_sections": [
            "Tổng quan",
            "Các biện pháp bảo mật đã triển khai",
            "Configuration",
            "Testing",
            "Troubleshooting",
        ],
        "required_features": [
            "Token Auto-Refresh",
            "Request Signing",
            "Rate Limiting",
            "CORS",
            "HTTPS",
            "Input Validation",
        ],
    },
    "SECURITY_TESTING.md": {
        "min_size": 5000,
        "required_sections": [
            "Tổng quan",
            "Rate Limiting",
            "CORS",
            "HTTPS",
            "Input Validation",
            "Request Signing",
            "Token Auto-Refresh",
        ],
        "required_test_cases": [
            "Test 1.1",
            "Test 2.1",
            "Test 3.1",
            "Test 4.1",
            "Test 5.1",
            "Test 6.1",
        ],
    },
    "API_SECURITY_TODO.md": {
        "min_size": 5000,
        "required_sections": [
            "Phase 1",
            "Phase 2",
            "Documentation Tasks",
            "Tổng Kết Hoàn Thành",
        ],
    },
}

# Implementation and test result files
IMPLEMENTATION_FILES = [
    "RATE_LIMITING_IMPLEMENTATION.md",
    "CORS_ENHANCEMENT_IMPLEMENTATION.md",
    "HTTPS_SECURITY_HEADERS_IMPLEMENTATION.md",
    "INPUT_VALIDATION_IMPLEMENTATION.md",
    "REQUEST_SIGNING_IMPLEMENTATION.md",
    "TOKEN_AUTO_REFRESH_IMPLEMENTATION.md",
]

TEST_RESULT_FILES = [
    "RATE_LIMITING_TEST_RESULTS.md",
    "CORS_TEST_RESULTS.md",
    "HTTPS_SECURITY_TEST_RESULTS.md",
    "INPUT_VALIDATION_TEST_RESULTS.md",
    "REQUEST_SIGNING_TEST_RESULTS.md",
    "TOKEN_AUTO_REFRESH_TEST_RESULTS.md",
]

def check_file_exists(filepath: Path) -> bool:
    """Check if file exists"""
    return filepath.exists() and filepath.is_file()

def check_file_size(filepath: Path, min_size: int) -> bool:
    """Check if file meets minimum size"""
    if not check_file_exists(filepath):
        return False
    return filepath.stat().st_size >= min_size

def check_sections(filepath: Path, required_sections: list) -> dict:
    """Check if file contains required sections"""
    if not check_file_exists(filepath):
        return {"found": [], "missing": required_sections}
    
    content = filepath.read_text(encoding='utf-8')
    found = []
    missing = []
    
    for section in required_sections:
        # Check for section headers (## or ###)
        pattern = rf'#+\s*{re.escape(section)}'
        if re.search(pattern, content, re.IGNORECASE):
            found.append(section)
        else:
            missing.append(section)
    
    return {"found": found, "missing": missing}

def check_features(filepath: Path, required_features: list) -> dict:
    """Check if file mentions required features"""
    if not check_file_exists(filepath):
        return {"found": [], "missing": required_features}
    
    content = filepath.read_text(encoding='utf-8')
    found = []
    missing = []
    
    for feature in required_features:
        if feature.lower() in content.lower():
            found.append(feature)
        else:
            missing.append(feature)
    
    return {"found": found, "missing": missing}

def check_test_cases(filepath: Path, required_test_cases: list) -> dict:
    """Check if file contains required test cases"""
    if not check_file_exists(filepath):
        return {"found": [], "missing": required_test_cases}
    
    content = filepath.read_text(encoding='utf-8')
    found = []
    missing = []
    
    for test_case in required_test_cases:
        if test_case in content:
            found.append(test_case)
        else:
            missing.append(test_case)
    
    return {"found": found, "missing": missing}

def check_links(filepath: Path) -> dict:
    """Check if file has proper links to other docs"""
    if not check_file_exists(filepath):
        return {"total": 0, "valid": 0, "invalid": 0}
    
    content = filepath.read_text(encoding='utf-8')
    
    # Find all markdown links
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    links = re.findall(link_pattern, content)
    
    valid = 0
    invalid = 0
    
    for text, url in links:
        # Check if it's a relative link to another doc
        if url.startswith('./') or url.startswith('../'):
            target_file = (filepath.parent / url).resolve()
            if target_file.exists():
                valid += 1
            else:
                invalid += 1
        elif url.endswith('.md'):
            # Absolute path or filename
            target_file = DOCS_DIR / url.split('/')[-1]
            if target_file.exists():
                valid += 1
            else:
                invalid += 1
        else:
            # External link or anchor, consider valid
            valid += 1
    
    return {"total": len(links), "valid": valid, "invalid": invalid}

def safe_print(text):
    """Print with safe encoding"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback for Windows console
        print(text.encode('ascii', 'ignore').decode('ascii'))

def test_main_documentation():
    """Test main documentation files"""
    print("=" * 60)
    print("Documentation Test - Task 2.3")
    print("=" * 60)
    
    results = []
    
    for doc_name, requirements in REQUIRED_DOCS.items():
        print(f"\n[TEST] {doc_name}")
        print("-" * 60)
        
        filepath = DOCS_DIR / doc_name
        test_result = {
            "file": doc_name,
            "exists": False,
            "size_ok": False,
            "sections_ok": False,
            "features_ok": False,
            "test_cases_ok": False,
            "links_ok": False,
        }
        
        # Check file exists
        if check_file_exists(filepath):
            test_result["exists"] = True
            print(f"  [OK] File exists")
        else:
            print(f"  [FAIL] File does not exist")
            results.append(test_result)
            continue
        
        # Check file size
        if check_file_size(filepath, requirements.get("min_size", 0)):
            test_result["size_ok"] = True
            size = filepath.stat().st_size
            print(f"  [OK] File size: {size} bytes (min: {requirements.get('min_size', 0)})")
        else:
            size = filepath.stat().st_size if filepath.exists() else 0
            print(f"  [FAIL] File size: {size} bytes (min: {requirements.get('min_size', 0)})")
        
        # Check sections
        if "required_sections" in requirements:
            sections = check_sections(filepath, requirements["required_sections"])
            if not sections["missing"]:
                test_result["sections_ok"] = True
                print(f"  [OK] All required sections found: {len(sections['found'])}/{len(requirements['required_sections'])}")
            else:
                safe_print(f"  [FAIL] Missing sections: {sections['missing']}")
        
        # Check features
        if "required_features" in requirements:
            features = check_features(filepath, requirements["required_features"])
            if not features["missing"]:
                test_result["features_ok"] = True
                print(f"  [OK] All required features found: {len(features['found'])}/{len(requirements['required_features'])}")
            else:
                safe_print(f"  [FAIL] Missing features: {features['missing']}")
        
        # Check test cases
        if "required_test_cases" in requirements:
            test_cases = check_test_cases(filepath, requirements["required_test_cases"])
            if not test_cases["missing"]:
                test_result["test_cases_ok"] = True
                print(f"  [OK] All required test cases found: {len(test_cases['found'])}/{len(requirements['required_test_cases'])}")
            else:
                safe_print(f"  [FAIL] Missing test cases: {test_cases['missing']}")
        
        # Check links
        links = check_links(filepath)
        if links["invalid"] == 0:
            test_result["links_ok"] = True
            print(f"  [OK] Links: {links['valid']} valid, {links['invalid']} invalid")
        else:
            print(f"  [WARNING] Links: {links['valid']} valid, {links['invalid']} invalid")
        
        results.append(test_result)
    
    return results

def test_implementation_files():
    """Test implementation documentation files"""
    print("\n" + "=" * 60)
    print("Implementation Files Test")
    print("=" * 60)
    
    results = []
    
    for impl_file in IMPLEMENTATION_FILES:
        filepath = DOCS_DIR / impl_file
        exists = check_file_exists(filepath)
        
        if exists:
            size = filepath.stat().st_size
            print(f"  [OK] {impl_file} ({size} bytes)")
        else:
            print(f"  [FAIL] {impl_file} - Missing")
        
        results.append({"file": impl_file, "exists": exists})
    
    return results

def test_test_result_files():
    """Test test result documentation files"""
    print("\n" + "=" * 60)
    print("Test Result Files Test")
    print("=" * 60)
    
    results = []
    
    for test_file in TEST_RESULT_FILES:
        filepath = DOCS_DIR / test_file
        exists = check_file_exists(filepath)
        
        if exists:
            size = filepath.stat().st_size
            print(f"  [OK] {test_file} ({size} bytes)")
        else:
            print(f"  [FAIL] {test_file} - Missing")
        
        results.append({"file": test_file, "exists": exists})
    
    return results

def main():
    """Run all documentation tests"""
    print("\n" + "=" * 60)
    print("Documentation Test Suite - Task 2.3")
    print("=" * 60)
    
    # Test main documentation
    main_results = test_main_documentation()
    
    # Test implementation files
    impl_results = test_implementation_files()
    
    # Test test result files
    test_results = test_test_result_files()
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    # Main docs
    main_ok = sum(1 for r in main_results if r.get("exists", False))
    print(f"\nMain Documentation:")
    print(f"  Files: {main_ok}/{len(REQUIRED_DOCS)}")
    
    # Implementation files
    impl_ok = sum(1 for r in impl_results if r.get("exists", False))
    print(f"\nImplementation Files:")
    print(f"  Files: {impl_ok}/{len(IMPLEMENTATION_FILES)}")
    
    # Test result files
    test_ok = sum(1 for r in test_results if r.get("exists", False))
    print(f"\nTest Result Files:")
    print(f"  Files: {test_ok}/{len(TEST_RESULT_FILES)}")
    
    # Overall
    total_files = len(REQUIRED_DOCS) + len(IMPLEMENTATION_FILES) + len(TEST_RESULT_FILES)
    total_ok = main_ok + impl_ok + test_ok
    
    print(f"\n" + "=" * 60)
    print(f"Overall: {total_ok}/{total_files} files")
    
    if total_ok == total_files:
        print("[SUCCESS] All documentation files exist!")
    else:
        print(f"[WARNING] {total_files - total_ok} files missing")
    
    print("=" * 60 + "\n")
    
    return 0 if total_ok == total_files else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())

