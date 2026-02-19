from ultralytics import YOLO

model = YOLO('roadguard_models/v2/weights/best.pt')

results = model.predict(
    source='test_data/images',
    save=False,  # сохранение рез-ов
    conf=0.1    # уверенность
)

for result in results:
    result.show()

print(f"Обработано {len(results)} изображений")