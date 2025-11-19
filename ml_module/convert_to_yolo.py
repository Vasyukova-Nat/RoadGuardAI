from pathlib import Path
import xml.etree.ElementTree as ET

CLASSES = {'D00': 0, 'D10': 1, 'D20': 2, 'D40': 3}

def convert_annotation(xml_path, txt_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    size = root.find('size')
    width = int(size.find('width').text)
    height = int(size.find('height').text)
    
    objects = root.findall('object')
    
    with open(txt_path, 'w') as f:
        for obj in objects:
            class_name = obj.find('name').text
            if class_name not in CLASSES:
                continue
                
            bndbox = obj.find('bndbox')
            xmin = int(bndbox.find('xmin').text)
            ymin = int(bndbox.find('ymin').text)
            xmax = int(bndbox.find('xmax').text)
            ymax = int(bndbox.find('ymax').text)
            
            x_center = (xmin + xmax) / 2.0 / width
            y_center = (ymin + ymax) / 2.0 / height
            w = (xmax - xmin) / width
            h = (ymax - ymin) / height
            
            f.write(f"{CLASSES[class_name]} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n")

xml_dir = Path("datasets/RDD2022_yolo_small/labels/train")

for xml_file in xml_dir.glob("*.xml"):
    txt_path = xml_file.with_suffix('.txt')
    convert_annotation(xml_file, txt_path)
    xml_file.unlink() 

print("Конвертация завершена!")