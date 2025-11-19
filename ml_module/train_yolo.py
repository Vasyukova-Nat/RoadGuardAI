from ultralytics import YOLO

model = YOLO('yolov8n.pt')

results = model.train(
    data='datasets/RDD2022_yolo_small_split/data.yaml',
    epochs=50,
    imgsz=640,           # размер изобр-я на входе
    batch=8,             # сколько изобр-ий обрабатывать за раз
    save=True,           # сохраняет модель
    verbose=True,        # вывод эпох
    project='roadguard_neuronet', # папка для результатов
    name='v1'            # имя эксперимента
)

print("Обучение завершено! Модель сохранена в runs/detect/")