import shutil
import random
from pathlib import Path

dataset_path = Path("datasets/RDD2022_yolo")
output_path = Path("datasets/RDD2022_yolo_split")

for folder in ["images/train", "images/val", "labels/train", "labels/val"]:
    (output_path / folder).mkdir(parents=True, exist_ok=True)

files = [f.stem for f in (dataset_path / "images/train").glob("*.jpg")]
random.shuffle(files) # перемешиваем файлы

split_idx = int(0.8 * len(files))  # разделяем train/val как 80/20

for i, name in enumerate(files):
    split = "train" if i < split_idx else "val"
    
    shutil.copy2(f"{dataset_path}/images/train/{name}.jpg", f"{output_path}/images/{split}/{name}.jpg")
    shutil.copy2(f"{dataset_path}/labels/train/{name}.txt", f"{output_path}/labels/{split}/{name}.txt")

print(f"Готово! {split_idx} train, {len(files)-split_idx} val")