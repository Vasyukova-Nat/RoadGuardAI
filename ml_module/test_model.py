from ultralytics import YOLO

model = YOLO('roadguard_models/v0/weights/best.pt')

results = model.predict(
    source='test_data/images',
    save=True,  # сохранение рез-ов
    conf=0.5    # уверенность
)

for result in results:
    result.show()

print(f"Обработано {len(results)} изображений")