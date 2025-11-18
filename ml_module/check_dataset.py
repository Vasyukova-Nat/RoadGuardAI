from pathlib import Path

def check_dataset():
    dataset_path = Path("datasets/RDD2022_yolo_small")
    
    print("Статистика датасета:")
    images = list((dataset_path / "images/train").glob("*.jpg"))
    labels = list((dataset_path / "labels/train").glob("*.xml"))
    
    print(f"Фото: {len(images)}")
    print(f"Аннотации: {len(labels)}")
    
    # Соответствие имен
    image_names = {f.stem for f in images}
    label_names = {f.stem for f in labels}
    common = image_names & label_names
    
    print(f"+ Парных файлов: {len(common)}")
    print(f"- Фото без аннотаций: {len(image_names - label_names)}")
    print(f"- Аннотаций без фото: {len(label_names - image_names)}")

    print("\nПроверка аннотаций:")
    label_files = list((dataset_path / 'labels/train').glob('*.xml'))
    for label_file in label_files[:10]:  # первые 10 
        print(f"\n{label_file.name}:")
        with open(label_file, 'r') as f:
            lines = f.readlines()
            for line in lines:
                print(f"  {line.strip()}")

check_dataset()