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
        const sliceWidth = img.width / 3;
        const sliceHeight = img.height / 3;
        
        this.gridContainer.innerHTML = '';
        this.downloadAllBtn.disabled = false;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                canvas.width = sliceWidth;
                canvas.height = sliceHeight;
                
                ctx.drawImage(img,
                    col * sliceWidth, row * sliceHeight,
                    sliceWidth, sliceHeight,
                    0, 0,
                    sliceWidth, sliceHeight
                );

                const sliceUrl = canvas.toDataURL('image/png');
                this.createGridItem(sliceUrl, row, col, sliceWidth, sliceHeight);
            }
        }
    }

    createGridItem(imageUrl, row, col, width, height) {
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