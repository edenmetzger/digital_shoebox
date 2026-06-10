#!/bin/zsh

SOURCE_DIR="./images"
OUTPUT_DIR="./images-web"

for file in "$SOURCE_DIR"/*.jpg; do
    [ -e "$file" ] || continue

    filename=$(basename "$file" .jpg)
    output="$OUTPUT_DIR/$filename.webp"

    if [ -f "$output" ]; then
        echo "Skipping $filename.jpg"
        continue
    fi

    echo "Converting $filename.jpg"

    cwebp "$file" \
        -resize 1000 0 \
        -q 50 \
        -m 6 \
        -o "$output"
done

echo "Done."