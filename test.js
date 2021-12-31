function onOpenCvReady() {
    document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}


let vm = new Vue({
    el: '#app',
    mounted: function () {
    },
    data: {
        src: new cv.Mat(),
        dst: new cv.Mat(),
        rMin: 130,
        gMin: 130,
        bMin: 130,
        rMax: 255,
        gMax: 255,
        bMax: 255,
        imgSrc: null,
    },
    watch: {
        rMin: function () {
            this.inRange();
        },
        gMin: function () {
            this.inRange();
        },
        bMin: function () {
            this.inRange();
        },
        rMax: function () {

            this.inRange();
        },
        gMax: function () {

            this.inRange();
        },
        bMax: function () {

            this.inRange();
        }
    },
    methods: {
        loadImage: function (e) {
            this.src.delete();
            let image = new Image();
            image.src = URL.createObjectURL(e.target.files[0]);
            image.onload = () => {
                this.src = cv.imread(image);
                // this.imgSrc = image.src;
                let wImg = this.wallExtraction(image);
                this.imgSrc = wImg;

            };
        },
        inRange: function () {
            if (this.imgSrc === null) return;
            this.dst.delete();
            this.dst = new cv.Mat();
            let min = [parseInt(this.rMin), parseInt(this.gMin), parseInt(this.bMin), 0];
            let max = [parseInt(this.rMax), parseInt(this.gMax), parseInt(this.bMax), 255];
            let low = new cv.Mat(this.src.rows, this.src.cols, this.src.type(), min);
            let high = new cv.Mat(this.src.rows, this.src.cols, this.src.type(), max);
            cv.inRange(this.src, low, high, this.dst);
            cv.imshow('canvasOutput', this.dst);
        },

        /**
         * 
         * @param {Image} image 
         * @returns {image/png}
         */
        wallExtraction: function (image) {

            let src = cv.imread(image);
            let dst = new cv.Mat();
            let low = new cv.Mat(this.src.rows, this.src.cols, this.src.type(), [130, 130, 130, 0]);
            let high = new cv.Mat(this.src.rows, this.src.cols, this.src.type(), [255, 255, 255, 255]);
            cv.inRange(src, low, high, this.dst);
            cv.imshow('bufCanvas', this.dst);
            return document.querySelector("#bufCanvas").toDataURL("image/png");
        },
    }
});