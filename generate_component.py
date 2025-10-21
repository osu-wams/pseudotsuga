#!/usr/bin/env python3
import os
import sys

# Mapping of design levels to Emulsify-style namespace folders
NAMESPACE_MAP = {
    "base": "components/00-base",
    "atoms": "components/01-atoms",
    "molecules": "components/02-molecules",
    "organisms": "components/03-organisms",
    "templates": "components/04-templates",
    "pages": "components/05-pages"
}

# Sample child component references for each higher-level component
CHILD_COMPONENTS = {
    "molecules": ["Heading", "Subheading", "TextLink"],
    "organisms": ["NameTitleBlock", "ContactInfo", "ResearchHighlights"],
    "templates": ["FacultyProfileCard", "CourseCard", "ProgramList"],
    "pages": ["FacultyProfilePage", "CourseOverviewPage"]
}

def create_component(name, level):
    # Validate design level
    if level not in NAMESPACE_MAP:
        print(f"❌ Invalid design level '{level}'. Choose from: {', '.join(NAMESPACE_MAP.keys())}")
        return

    # Define the base path for the component
    base_path = os.path.join(NAMESPACE_MAP[level], name)
    os.makedirs(base_path, exist_ok=True)

    # Define file paths
    twig_file = os.path.join(base_path, f"{name}.twig")
    yaml_file = os.path.join(base_path, f"{name}.yml")
    story_file = os.path.join(base_path, f"{name}.stories.js")

    # Determine child components to include
    children = CHILD_COMPONENTS.get(level, [])

    # Generate Twig content with child includes
    if children:
        twig_content = ""
        for child in children:
            twig_content += f"{{% include \"@{child}/{child}.twig\" with {{ text: text }} %}}\n"
    else:
        twig_content = f"<div class=\"{name.lower()}\">{{{{ text }}}}</div>\n"

    # YAML content
    yaml_content = "text: 'Hello World'\n"

    # Generate Storybook content with imports
    story_imports = f"import {name} from './{name}.twig';\nimport data from './{name}.yml';\n"
    for child in children:
        story_imports += f"import {child} from '../../{NAMESPACE_MAP.get('atoms') if level == 'molecules' else NAMESPACE_MAP.get('molecules')}/{child}/{child}.twig';\n"

    story_content = f"""{story_imports}
export default {{
  title: '{level.capitalize()}/{name}',
}};

export const Default = () => {name}(data);
"""

    # Write files and set permissions
    with open(twig_file, "w") as f:
        f.write(twig_content)
    with open(yaml_file, "w") as f:
        f.write(yaml_content)
    with open(story_file, "w") as f:
        f.write(story_content)

    os.chmod(twig_file, 0o644)
    os.chmod(yaml_file, 0o644)
    os.chmod(story_file, 0o644)

    print(f"✅ Component '{name}' created in '{NAMESPACE_MAP[level]}' with child references and files.")

# Entry point
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 generate_component.py <ComponentName> <DesignLevel>")
    else:
        component_name = sys.argv[1]
        design_level = sys.argv[2].lower()
        create_component(component_name, design_level)

