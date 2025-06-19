from pdf2image import convert_from_path

images = convert_from_path(r'C:\Users\vidya\Downloads\22VBIT051755.pdf')
for i, image in enumerate(images):
    image.save(f'page_{i}.jpg', 'JPEG')
