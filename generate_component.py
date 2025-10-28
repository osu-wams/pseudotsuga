#!/usr/bin/env python3
import os
import sys

NAMESPACE_MAP = {
    "base": "components/00-base",
    "atoms": "components/01-atoms",
    "molecules": "components/02-molecules",
    "organisms": "components/03-organisms",
    "templates": "components/04-templates",
    "pages": "components/05-pages"
}

def create_component(name, level, children):
    if level not in NAMESPACE_MAP:
        print(f"❌ Invalid design level '{level}'. Choose from: {', '.join(NAMESPACE_MAP.keys())}")
        return

    base_path = os.path.join(NAMESPACE_MAP[level], name)
    os.makedirs(base_path, exist_ok=True)

    twig_file = os.path.join(base_path, f"{name}.twig")
    yaml_file = os.path.join(base_path, f"{name}.yml")
    story_file = os.path.join(base_path, f"{name}.stories.js")

    if children:
        twig_content = ""
        for child in children:
            twig_content += f"{{% include \"@{child}/{child}.twig\" with {{ text: text }} %}}\n"
    else:
        twig_content = f"<div class=\"{name.lower()}\">{{{{ text }}}}</div>\n"

    yaml_content = "text: 'Hello World'\n"

    story_imports = f"import {name} from './{name}.twig';\nimport data from './{name}.yml';\n"
    for child in children:
        child_level = "01-atoms" if level == "molecules" else "02-molecules" if level == "organisms" else "03-organisms"
        story_imports += f"import {child} from '../../{child_level}/{child}/{child}.twig';\n"

    story_content = f"""{story_imports}
export default {{
  title: '{level.capitalize()}/{name}',
}};

export const Default = () => {name}(data);
"""

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

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 generate_component.py <ComponentName> <DesignLevel> [Child1,Child2,...]")
    else:
        component_name = sys.argv[1]
        design_level = sys.argv[2].lower()
        child_components = sys.argv[3].split(",") if len(sys.argv) == 4 else []
        create_component(component_name, design_level, child_components)
