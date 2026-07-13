# AI Wall Measurement Service

This microservice uses YOLOv8 to detect walls and calculate their area for cleaning cost estimation.

## Setup

1.  **Install Python 3.8+**
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the service:**
    ```bash
    python app.py
    ```

The service will start on `http://localhost:5000`.

## API Endpoint

**POST /analyze-wall**

*   **Body:** `multipart/form-data` with `image` field.
*   **Response:**
    ```json
    {
      "area_m2": 12.5,
      "pixel_area": 1250000,
      "confidence": 0.95
    }
    ```

## Notes

- The service downloads the `yolov8n-seg.pt` model on first run.
- Calibration ratio is currently hardcoded for demonstration purposes. In a production environment, you would need a reference object in the image (like a card or coin) to calculate the real-world scale dynamically.
