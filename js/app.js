class ImageSlicer {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.currentFile = null;
    }

    initElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.originalImage = document.getElementById('originalImage');
        this.imageDimensions = document.getElementById('imageDimensions');
        this.imageSize = document.getElementById('imageSize');
        this.gridContainer = document.getElementById('gridContainer');
        this.downloadAllBtn = document.getElementById('downloadAll');
    }

    bindEvents() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        this.processFile(file);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        this.processFile(file);
    }

    processFile(file) {
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过10MB！');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);
        this.loadAndDisplayImage(file);
    }

    displayFileInfo(file) {
        this.imageSize.textContent = this.formatFileSize(file.size);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    loadAndDisplayImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.imageDimensions.textContent = `${img.width} × ${img.height}`;
                this.originalImage.src = e.target.result;
                this.originalImage.style.display = 'block';
                this.sliceImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    sliceImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算最佳尺寸，保持原图比例
        let targetWidth, targetHeight;
        if (img.width > img.height) {
            // 横图
            targetWidth = Math.min(1200, img.width); // 限制最大宽度
            targetHeight = (targetWidth * img.height) / img.width;
        } else {
            // 竖图
            targetHeight = Math.min(1200, img.height); // 限制最大高度
            targetWidth = (targetHeight * img.width) / img.height;
        }
        
        // 创建一个正方形画布，使用较长边作为画布尺寸
        const canvasSize = Math.max(targetWidth, targetHeight);
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // 计算居中位置
        const offsetX = (canvasSize - targetWidth) / 2;
        const offsetY = (canvasSize - targetHeight) / 2;
        
        // 绘制白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // 在画布中央绘制缩放后的图片
        ctx.drawImage(img, 
            0, 0, img.width, img.height,  // 源图像区域
            offsetX, offsetY, targetWidth, targetHeight  // 目标区域
        );
        
        // 计算每个切片的尺寸
        const sliceSize = Math.floor(canvasSize / 3);
        
        this.gridContainer.innerHTML = '';
        this.downloadAllBtn.disabled = false;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const sliceCanvas = document.createElement('canvas');
                const sliceCtx = sliceCanvas.getContext('2d');
                
                sliceCanvas.width = sliceSize;
                sliceCanvas.height = sliceSize;
                
                const sourceX = col * sliceSize;
                const sourceY = row * sliceSize;
                
                // 绘制切片
                sliceCtx.drawImage(canvas,
                    sourceX, sourceY,
                    sliceSize, sliceSize,
                    0, 0,
                    sliceSize, sliceSize
                );

                const sliceUrl = sliceCanvas.toDataURL('image/png');
                this.createGridItem(sliceUrl, row, col);
            }
        }
    }

    createGridItem(imageUrl, row, col) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '下载';
        downloadBtn.onclick = () => this.downloadImage(imageUrl, row, col);

        gridItem.appendChild(img);
        gridItem.appendChild(downloadBtn);
        this.gridContainer.appendChild(gridItem);
    }

    downloadImage(imageUrl, row, col) {
        const link = document.createElement('a');
        link.download = `slice_${row + 1}_${col + 1}.png`;
        link.href = imageUrl;
        link.click();
    }

    async downloadAllImages() {
        const images = Array.from(this.gridContainer.getElementsByTagName('img'));
        const zip = new JSZip();

        images.forEach((img, index) => {
            const row = Math.floor(index / 3) + 1;
            const col = (index % 3) + 1;
            const imageData = img.src.split(',')[1];
            zip.file(`slice_${row}_${col}.png`, imageData, {base64: true});
        });

        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.download = 'nine_grid_slices.zip';
        link.href = URL.createObjectURL(content);
        link.click();
    }
}

// 初始化应用
new ImageSlicer(); 