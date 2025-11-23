from pathlib import Path

def check_dataset():
    dataset_path = Path("datasets/RDD2022_yolo_half_split")
    
    for split in ["train", "val"]:
        print(f"\n=== {split} ===")
        
        images = list((dataset_path / "images" / split).glob("*.jpg"))
        labels = list((dataset_path / "labels" / split).glob("*.txt"))
    
        # Соответствие имен 
        image_names = {f.stem for f in images}
        label_names = {f.stem for f in labels}
        common = image_names & label_names

        print(f"+ Парных файлов (фото + аннотация): {len(common)}")
        print(f"- Фото без аннотаций: {len(image_names - label_names)}")
        print(f"- Аннотаций без фото: {len(label_names - image_names)}")

        print("\nПроверка аннотаций:")
        label_files = list((dataset_path / 'labels' / split).glob('*.txt'))
        for label_file in label_files[:3]:  # первые 3
            print(f"\n{label_file.name}:")
            with open(label_file, 'r') as f:
                lines = f.readlines()
                for line in lines:
                    print(f"  {line.strip()}")

check_dataset()