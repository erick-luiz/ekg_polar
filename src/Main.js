let EkGraph = (function(){

    // Chart global configurations
    let _config = {
        layers: 4,
        centerX: 0.8125 * 400,
        centerY: 0.8125 * 400,
        sizeControl: (0.065 * 800) / (6 / 5),
        fixAngle: -0.5 * Math.PI,
        currentAngle: 0 * Math.PI,
        sliceAngle: (2/4 * Math.PI),
        defaultFillColor: '#F5DF65',
        colors: [],
        cx: null,
        slices: 2,
        defaultColor: '#fff',
        canvas: null,
        data: [],
        ray: null,
        boldQuarte: true
    }

    let _draw = (canvas) => {
        let { cx } = _config;
        _config.canvas = canvas;
        cx.fillStyle = "white";
		cx.fillRect(0,0,canvas.width,canvas.height);
		cx.rect(0,0,canvas.width,canvas.height);
        cx.stroke();
    }

    // This method split the label in  each ';' breaking the line in there.
    let _printText = (labels) => {
        labels.split(';').forEach((label, idx) => {
            _config.cx.fillText(label, 0, idx * 25);
        });
    }

    // This calc puts the label in the corret position based in its index
    let _labelPositionControl = (nSlices) => {
        let oddPlus = nSlices%2 === 0? 0: 0.5;
        return Math.round(nSlices / 2) + 1 - oddPlus;
    }

    // This method will print the labels
    let _drawLabels = (cx, color = '#000') => {

        const  ray  = _config.ray * 1.06;
        
        const rotatePercent = 0.5;
        const moveX = 1.33;
        const moveY = 1.1;

        cx.font = ray * 0.06 + "px Ariel";
		cx.fillStyle = color;
        cx.textAlign = "center";

        cx.translate(moveX * ray, moveY * ray);
        let control = _labelPositionControl(_config.slices);
        for(i = 1; i <= _config.slices; i++){
          let ang = (i - control) * _config.sliceAngle + (_config.sliceAngle * rotatePercent);
          _rotate(cx, ang, ray);
          _printText(_config.labels[i-1]?_config.labels[i-1]: '');
          _rotate(cx, ang, -ray);
        }
        cx.translate(-(moveX * ray), -(moveY * ray));
    }

    // This method rotates the canvas for printing the label in tha right position.
    let _rotate = (cx, ang, ray) => {
        cx.rotate(ang);
        cx.translate(0, ray);
        cx.rotate(-ang);
    }

    // This method removes the last line color printing another white line over that.
    let _hiddenLastLine = () => {
        const {cx, ray } = _config;
        let clr = _config.cx.strokeStyle;

        cx.beginPath();
        cx.arc(_config.centerX, _config.centerY, ray, 0, 2 * Math.PI);
        cx.lineWidth=10;
        cx.strokeStyle = _config.defaultColor;
        cx.stroke();

        // Reset 
        cx.strokeStyle = clr;
        cx.lineWidth = 1;
        cx.restore();
    }

    // This method draw a bold line on middle 
    let _quarterLine = () => {
        const {cx, ray } = _config;
        const sX = _config.centerX;
        const sY = _config.centerY;
        let clr = _config.cx.strokeStyle;
        cx.strokeStyle= 'black';
        cx.lineWidth=5;
        for(i = 0.5; i <= 2; i += 0.5){
            cx.beginPath();
            cx.arc(sX, sY, ray, i, i * Math.PI);    
            cx.lineTo(sX, sY);
            cx.stroke();
        }
        cx.strokeStyle = clr;
        cx.lineWidth = 1;
    }

    // This method draws a slice and to fill that until its level
    let _drawSlice = (slice, plusLine = 1) => {

        let ray = _config.sizeControl;
        const {cx, defaultColor} = _config;
        const sX = _config.centerX;
        const sY = _config.centerY;

        // Start and EndAngle 
        const sAngle = _config.fixAngle + _config.currentAngle + (slice.idx - 1) * _config.sliceAngle;
        const eAngle = _config.fixAngle + slice.idx * _config.sliceAngle;

        for(i = _config.layers ; i > 0; i--) {

            _config.cx.beginPath();
            cx.arc(sX, sY, ray * i, sAngle, eAngle);
            cx.lineTo(sX, sY);
            if(slice.value >= i) {
                cx.fillStyle = _selectSliceColor(slice, i-1);
            } else {
                cx.fillStyle = defaultColor;
            }
            cx.fill();
            cx.stroke();
        }
        _drawLine(eAngle, sAngle, plusLine);
    }

    let _selectSliceColor = (slice, level) => {
        const { colors, defaultFillColor} = _config;
        
        if(slice && slice.colors && slice.colors.length > 0) {
            return slice.colors[level]? slice.colors[level]: slice.colors[slice.colors.length - 1];
        } 
        
        if(colors && colors.length > 0) {
            return colors[level]? colors[level]: colors[colors.length - 1];
        }

        return defaultFillColor;
    }

    let _drawLine = (sAngle, eAngle, plusLine = 1) => {
        const sX = _config.centerX;
        const sY = _config.centerY;
        const { ray  } = _config;

        _printLine(sX, sY, ray, sAngle, eAngle, '#aaa')
        _printLine(sX, sY, ray, sAngle, eAngle);
    }

    let _printLine = (sX, sY, ray, sAngle, eAngle, color, lineSize) => {
        const { cx } = _config; 
        cx.beginPath();
        cx.strokeStyle  = color || '#000';
        cx.arc(sX, sY, ray, sAngle, eAngle);
        cx.lineTo(sX, sY);
        cx.stroke(); 
        _config.cx.save();
    }

    let initConfig = function(canvas, data, options){
        
        let slices = data.length;
        let layers = options.layers || 1;

        _config.slices = slices > 2? slices: 2;
        _config.cx = canvas.getContext("2d");
        _config.centerX = canvas.width/2;
        canvas.height = 0.8125 * canvas.width;
        _config.centerY = canvas.height/2;
        _config.sliceAngle = 1/slices * 2 * Math.PI;
        _config.layers = layers;
        _config.ray = (0.7 * canvas.width) / 2;
        _config.sizeControl = _config.ray / (layers + 1);
        _config.cx.save();
        _draw(canvas);
        data = data.map((slice, idx) =>  {
            return {...slice, idx: idx + 1 }
        });
        _setLabels(data.map(item => item.label));
        fillGraphData(data);
    }

    let _reset = () => {
        if(_config.slices % 4 === 0 && _config.boldQuarte){
            _quarterLine();
            _config.cx.save();
        }
        _hiddenLastLine();
        _config.cx.save();
        _drawLabels(_config.cx);
        _config.cx.save();
    }

    let fillGraphData = (data = []) => {
        _config.data = data;
        data.forEach((slice) => {
            _drawSlice(slice);
        });
        _reset();
    }

    let setColors = (colors) => _config.colors = colors || [];
    let _setLabels = (labels) => _config.labels = labels || [];
    
    let _clear = () => {
        _config.cx.clearRect(0, 0, _config.canvas.width, _config.canvas.height);
        _draw(_config.canvas);
    }

    let drawSlice = (sliceIdx, levelToDraw) => {
        if(!sliceIdx || sliceIdx > _config.slices) return; 
        levelToDraw = levelToDraw > _config.layers? _config.layers: levelToDraw < 0? 0: levelToDraw;
        _config.data .forEach((slice, idx) => {
            if((idx + 1) === sliceIdx){
                slice.value = levelToDraw;
            }
        });
        _clear();
        fillGraphData(_config.data);
    }
        
    return { fillGraphData , initConfig , drawSlice, setColors}  
})();