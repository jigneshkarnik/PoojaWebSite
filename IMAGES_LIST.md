# Images Used in the Website

## Image Directory Structure
All images should be stored in the `images/` folder at the root of the project.

## Images List

| # | Image Name | Original URL | Local Path | Description |
|---|---|---|---|---|
| 1 | whatsapp-icon.png | https://lh3.googleusercontent.com/sitesv/AAzXCkcEr6RcPrM448MoXlBw91E8zFoT-gtcPXsAbgaDlMH-7VxgUB8C-tITmJjtjMefO3We4pqOV4hxPjcC_YLf5XqdeeoQ2kuFP4xSogJhIOx1PiUb46yfBXm9E4x9Lj0lWWAVZ178bsqRlDDqV4qU3o0EUSRIlN19f_UOAnUybV75q5MshoBetd1XoI8BEs-mdqXyg3rfOLD5xZnM3Pzv2SguCAo08zrm3F67mJU=w1280 | images/whatsapp-icon.png | WhatsApp contact icon |
| 2 | telegram-icon.png | https://lh3.googleusercontent.com/sitesv/AAzXCkectj8Q0uWImCwcrlIIFvsoMuceXmIQlga9EG9bvavfBWcAwWGpoqh9BCm4PYBmVSjKETTBm78zwhHv0b3mGWSl5t2nyu5JCCQqNUfEd045vJoXtgXUVRwvNdHmOZgwLeelsnLIcBkZZffEVLsPpgLB-qmOvix89U-Lsp1l8cd2u9La_SEEfYZ6YUq9GpyJqBdsbWg7g2O7T0KDsXMnebQED9siO1sdddWj=w1280 | images/telegram-icon.png | Telegram contact icon |
| 3 | email-icon.png | https://lh3.googleusercontent.com/sitesv/AAzXCkdw_Uff9K7IHutZDl1v-RQxeL-5z_LcGgFjX1sL6szzG8GAZjISNxD4iF6ax4vmRKPX_NtYSQWKa0obgh9W41-bjdmzRIzJwnqbIQchUSSiyLc4wwBamOvw8T3dXdiJ1QVVDo5aQdl3YVD33Ips702CxY-joic-GNmd3Syq-YmBA4RZChyoDYdxWJsY0BrdYgIUgcWuhV7_hAuL0AaDyeW9_56t_ssDGZIfjtU=w1280 | images/email-icon.png | Email contact icon |

## How to Download Images

Run the provided script to download all images:

```bash
bash download_images.sh
```

This will:
1. Create the `images/` directory if it doesn't exist
2. Download all images from their original URLs
3. Save them with optimized names in the `images/` folder

## Image References in HTML

All image references in `index.html` have been updated to use local paths:
- `./images/whatsapp-icon.png`
- `./images/telegram-icon.png`
- `./images/email-icon.png`
