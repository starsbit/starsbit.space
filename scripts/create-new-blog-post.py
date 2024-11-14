import os
import shutil
import json
from datetime import datetime
import re

def update_markdown_line(markdown_text, folder_name):
    # Define the folder path you want to prepend
    folder_path = "assets/images/blog/" + folder_name + "/"

    # Regex pattern to match markdown image syntax
    pattern = r'!\[([^\]]+)\]\(([^)]+)\)'

    # Replacement function to modify the image path
    def replace_image_path(match):
        alt_text = match.group(1)
        image_path = match.group(2)
        # Add the folder path to the image path
        new_image_path = folder_path + image_path
        return f'![{alt_text}]({new_image_path})'

    # Apply the regex replacement
    return re.sub(pattern, replace_image_path, markdown_text)


def create_blog_post():
    # Ask for user input for the file name
    title = input("Enter the file name: ")
    file_name = title.lower().replace(' ', '-').replace('.', '').replace(',', '').replace('?', '').replace('!', '')
    description = input("Enter the description: ")
    tags = input("Enter tags (comma separated): ").split(',')

    # Define paths
    folder_path = os.path.join('src', 'assets', 'images', 'blog', file_name)
    file_path = os.path.join('src', 'assets', 'data', 'blog-posts', f"{file_name}.md")
    scripts_folder = os.path.join('scripts')
    json_path = os.path.join('src', 'assets', 'data', 'blog-posts.json')

    # Create the folder
    os.makedirs(folder_path, exist_ok=True)

    # Create the .md file
    with open(file_path, 'w') as md_file:
        md_file.write("")  # Create an empty .md file

    # Move all files that are not .py or .md to the created folder
    for item in os.listdir(scripts_folder):
        item_path = os.path.join(scripts_folder, item)
        if os.path.isfile(item_path) and not item.endswith(('.py', '.md')):
            shutil.move(item_path, folder_path)

    # Copy the .md content to the created file and update image paths
    for item in os.listdir(scripts_folder):
        item_path = os.path.join(scripts_folder, item)
        if item.endswith('.md'):
            with open(item_path, 'r') as source_file:
                content = source_file.read()
            # Update image paths in the markdown content
            updated_content = update_markdown_line(content, file_name)
            with open(file_path, 'a') as dest_file:
                dest_file.write(updated_content)

    # Update the JSON file
    new_entry = {
        "title": title,
        "description": description,
        "date": datetime.now().strftime("%d.%m.%Y"),
        "image": f"assets/images/blog/{file_name}/image.png",
        "thumbnail": f"assets/images/blog/{file_name}/thumbnail.png",
        "tags": tags,
        "route": file_name,
        "published": False,
        "file": f"assets/data/blog-posts/{file_name}.md",
        "author": "stars",
        "sources": []
    }

    with open(json_path, 'r+') as json_file:
        data = json.load(json_file)
        data.append(new_entry)
        json_file.seek(0)
        json.dump(data, json_file, indent=2)

if __name__ == "__main__":
    create_blog_post()