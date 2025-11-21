import os

def get_company_logo_path() -> str:
    """
    Resolve the path to the company logo.
    Checks environment variable COMPANY_LOGO_PATH first,
    then defaults to project_root/image/logo_phucdat.jpg (or .png, .jpeg, .svg).
    """
    # 1. Check environment variable
    env_logo = os.getenv("COMPANY_LOGO_PATH")
    if env_logo and os.path.exists(env_logo):
        return env_logo

    # 2. Check default locations
    # Assuming this file is in backend/utils/file_utils.py
    # project_root is ../../ from here
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    
    default_logo_path = os.path.join(project_root, 'image', 'logo_phucdat.jpg')
    
    # Check if default exists
    if os.path.exists(default_logo_path):
        return default_logo_path
        
    # Try other extensions
    for ext in ['.png', '.jpeg', '.svg']:
        logo_path_with_ext = os.path.join(project_root, 'image', f'logo_phucdat{ext}')
        if os.path.exists(logo_path_with_ext):
            return logo_path_with_ext
            
    return default_logo_path
