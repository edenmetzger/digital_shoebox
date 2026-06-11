#!/bin/zsh

SOURCE_DIR="./images"
OUTPUT_DIR="./images-web"

for file in "$SOURCE_DIR"/*.jpg "$SOURCE_DIR"/*.webp; do
    [ -e "$file" ] || continue

    filename=$(basename "${file%.*}")
    output="$OUTPUT_DIR/$filename.webp"

    echo "Converting $(basename "$file")"

    cwebp "$file" \
        -resize 1000 0 \
        -q 50 \
        -o "$output"
done

echo "Done."