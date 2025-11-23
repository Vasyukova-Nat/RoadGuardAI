import shutil
import random
from pathlib import Path

source_path = Path("datasets/RDD2022_yolo")
dest_path = Path("datasets/RDD2022_yolo_half")

(dest_path / "images/train").mkdir(parents=True, exist_ok=True)
(dest_path / "labels/train").mkdir(parents=True, exist_ok=True)

all_images = list((source_path / "images/train").glob("*.jpg"))
random.seed(42)
selected_images = random.sample(all_images, len(all_images) // 2)
print(f"Выбрано {len(selected_images)} из {len(all_images)} изображений")

for img_path in selected_images:
    dest_img = dest_path / "images/train" / img_path.name
    shutil.copy2(img_path, dest_img)
    
    label_name = img_path.stem + ".xml"
    src_label = source_path / "labels/train" / label_name
    dest_label = dest_path / "labels/train" / label_name
    
    if src_label.exists():
        shutil.copy2(src_label, dest_label)
    else:
        print(f"Аннотация не найдена: {label_name}")

print("Датасет создан")
