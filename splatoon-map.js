import KeybordState from "./keyboard.js";

const stageName = {
    "battera": "バッテラストリート",
    "huzitubo": "フジツボスポーツクラブ",
    "gangaze": "ガンガゼ野外音楽堂",
    "konbu": "コンブトラック",
    "ama": "海女美術大学",
    "tyouzame": "チョウザメ造船",
    "tatiuo": "タチウオパーキング",
    "hokke": "ホッケふ頭",
    "manta": "マンタマリア号",
    "mozuku": "モズク農園",
    "engawa": "エンガワ河川敷",
    "b_basu": "Bバスパーク",
    "zatou": "ザトウマーケット",
    "hakohugu": "ハコフグ倉庫",
    "debon": "デボン海洋博物館",
    "arowana": "アロワナモール",
    "azihurai": "アジフライスタジアム",
    "syotturu": "ショッツル鉱山",
    "mongara": "モンガラキャンプ場",
    "sumesi": "スメーシーワールド",
    "otoro": "ホテルニューオートロ",
    "antyobi": "アンチョビットゲームズ",
    "mutugo": "ムツゴ楼",
};

let vm = new Vue({
    el: '#app',
    mounted: function () {


        axios.get('stage.json')
            .then((res) => {
                this.stageData = res.data;
            });
        this.app = new PIXI.Application({
            width: this.canvasWidth, height: this.canvasHeigth, backgroundColor: 0x000000, resolution: window.devicePixelRatio || 1,
            autoResize: true
        });
        document.querySelector('#canvas').appendChild(this.app.view);
        this.app.view.addEventListener('wheel', this.wheelEvent);
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        this.app.ticker.add(this.animate.bind(this));

        this.inkSetting();

        this.stageSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.container.addChild(this.stageSprite);

        this.inkPointerSetting();
        this.buttonSetting();
        this.charSetting();
        this.ruleObjSetting();
        this.loadStage(this.pickRule, this.pickStage);

        this.keyEvent();

    },
    data: {
        onHelp: false,
        stageData: {},
        ruleNames: {
            "area": "ガチエリア",
            "yagura": "ガチヤグラ",
            "hoko": "ガチホコ",
            "asari": "ガチアサリ",
        },
        stageNames: {
            "battera": "バッテラストリート",
            "huzitubo": "フジツボスポーツクラブ",
            "gangaze": "ガンガゼ野外音楽堂",
            "konbu": "コンブトラック",
            "ama": "海女美術大学",
            "tyouzame": "チョウザメ造船",
            "tatiuo": "タチウオパーキング",
            "hokke": "ホッケふ頭",
            "manta": "マンタマリア号",
            "mozuku": "モズク農園",
            "engawa": "エンガワ河川敷",
            "b_basu": "Bバスパーク",
            "zatou": "ザトウマーケット",
            "hakohugu": "ハコフグ倉庫",
            "debon": "デボン海洋博物館",
            "arowana": "アロワナモール",
            "azihurai": "アジフライスタジアム",
            "syotturu": "ショッツル鉱山",
            "mongara": "モンガラキャンプ場",
            "sumesi": "スメーシーワールド",
            "otoro": "ホテルニューオートロ",
            "antyobi": "アンチョビットゲームズ",
            "mutugo": "ムツゴ楼",
        },
        pickRule: "hoko",
        pickStage: "tatiuo",
        stage: {},// image
        stageSprite: {},
        canvasWidth: 1280,
        canvasHeigth: 720,
        app: {},// PIXI.Application
        container: {},// PIXI.Container

        obj: {},
        objbg: {},
        charcters: [],

        penColor: {},
        eraseColor: {},
        penWeight: 10,

        allyInkMaskTexture: {},
        enemyInkMaskTexture: {},

        inkContainer: {},// PIXI.Container
        inkPointer: {},
        isPaint: false,

        lastPoint: {},
        nowPoint: {},

        touchCharacter: null,
        animateFuncs: new Map(),

        myRespawn: new PIXI.Point(310, 492),
        enemyRespawn: new PIXI.Point(935, 233),

        allyColor: 0xebd244,
        enemyColor: 0x9b31ff,

        wallMaskLoaded: false,

    },
    methods: {

        loadStage: function (ruleName, stageName) {
            const stageImg = new Image();
            stageImg.onload = () => {
                const stageMask = new Image();
                stageMask.onload = () => {

                    this.stageSprite.texture = PIXI.Texture.from(stageImg);

                    const stageMaskTexture = PIXI.Texture.from(stageMask);
                    const stageMaskSprite = new PIXI.Sprite(stageMaskTexture);
                    this.inkContainer.mask = stageMaskSprite;

                    this.initCharcterPoint(ruleName, stageName);
                    this.initObjPoint(ruleName, stageName);
                };
                stageMask.src = `./img/splatoon-stage/${ruleName}/${stageName}-${ruleName}-floor.png`;
            };
            stageImg.src = `./img/splatoon-stage/${ruleName}/${stageName}-${ruleName}.png`;
        },
        ruleObjSetting: function (ruleName, stageName) {

            const objectTextuer = PIXI.Texture.from('img/object.png');
            const objectbgTextuer = PIXI.Texture.from('img/object-bg.png');
            const objbg = new PIXI.Sprite(objectbgTextuer);
            objbg.x = 0;
            objbg.y = 0;
            objbg.anchor.set(0.5);
            objbg.scale.x = 0.10;
            objbg.scale.y = 0.10;
            this.container.addChild(objbg);

            const objContainer = new PIXI.Container();
            const obj = new PIXI.Sprite(objectTextuer);
            obj.x = 0;
            obj.y = 0;
            obj.anchor.set(0.5);
            obj.scale.x = 0.10;
            obj.scale.y = 0.10;
            obj.alpha = 0.8;
            obj.interactive = true;
            obj.buttonMode = true;
            obj.on('pointerdown', onDragStart)
                .on('pointerup', onDragEnd)
                .on('pointerupoutside', onDragEnd)
                .on('pointermove', onDragMove);
            objContainer.addChild(obj);
            this.app.stage.addChild(objContainer);

            this.objbg = objbg;
            this.obj = obj;

            this.animateFuncs.set(this.bringObj.bind(this));
        },
        charSetting: function (ruleName, stageName) {

            const ownTextuer = PIXI.Texture.from('img/own-frame.png');
            const allyTextuer = PIXI.Texture.from('img/player-frame.png');
            const allyMaskTextuer = PIXI.Texture.from('img/player-mask-a.png');

            for (let i = 0; i < 4; i++) {
                const pContainer = new PIXI.Container();
                pContainer.x = 0;
                pContainer.y = 0;

                const ally = new PIXI.Sprite((i === 0) ? ownTextuer : allyTextuer);
                ally.anchor.set(0.5);
                ally.x = 0;
                ally.y = 0;
                ally.scale.x = 0.1;
                ally.scale.y = 0.1;

                const allyMask = new PIXI.Sprite(allyMaskTextuer);
                allyMask.anchor.set(0.5);
                allyMask.x = 0;
                allyMask.y = 0;
                allyMask.scale.x = 0.1;
                allyMask.scale.y = 0.1;
                allyMask.tint = this.allyColor;

                pContainer.addChild(allyMask, ally);
                pContainer.interactive = true;
                pContainer.buttonMode = true;
                pContainer.on('pointerdown', onDragStart)
                    .on('pointerdown', () => {
                        this.touchCharacter = pContainer;
                    })
                    .on('pointerup', onDragEnd)
                    .on('pointerup', () => {
                        this.touchCharacter = null;
                    })
                    .on('pointerupoutside', onDragEnd)
                    .on('pointerupoutside', () => {
                        this.touchCharacter = null;
                    })
                    .on('pointermove', onDragMove);

                this.app.stage.addChild(pContainer);
                this.charcters.push(pContainer);
            }

            for (let i = 0; i < 4; i++) {
                const eContainer = new PIXI.Container();
                eContainer.x = 0;
                eContainer.y = 0;

                const enemy = new PIXI.Sprite(allyTextuer);
                enemy.anchor.set(0.5);
                enemy.x = 0;
                enemy.y = 0;
                enemy.scale.x = 0.1;
                enemy.scale.y = 0.1;

                const enemyMask = new PIXI.Sprite(allyMaskTextuer);
                enemyMask.anchor.set(0.5);
                enemyMask.x = 0;
                enemyMask.y = 0;
                enemyMask.scale.x = 0.1;
                enemyMask.scale.y = 0.1;
                enemyMask.tint = this.enemyColor;

                eContainer.addChild(enemyMask, enemy);
                eContainer.interactive = true;
                eContainer.buttonMode = true;
                eContainer.on('pointerdown', onDragStart)
                    .on('pointerdown', () => {
                        this.touchCharacter = eContainer;
                    })
                    .on('pointerup', onDragEnd)
                    .on('pointerup', () => {
                        this.touchCharacter = null;
                    })
                    .on('pointerupoutside', onDragEnd)
                    .on('pointerupoutside', () => {
                        this.touchCharacter = null;
                    })
                    .on('pointermove', onDragMove);

                this.app.stage.addChild(eContainer);
                this.charcters.push(eContainer);
            }
        },

        initObjPoint: function (ruleName, stageName) {
            const sd = this.stageData[ruleName][stageName];
            this.objbg.x = sd.objX;
            this.objbg.y = sd.objY;
            this.obj.x = sd.objX;
            this.obj.y = sd.objY;
        },
        initCharcterPoint: function (ruleName, stageName) {

            const sd = this.stageData[ruleName][stageName];
            for (let i = 0; i < 4; i++) {
                const ally = this.charcters[i];
                ally.x = sd.allyRespawnX - 10 + ((i % 2) * 20);
                ally.y = sd.allyRespawnY - 10 + (parseInt(i / 2) * 20);
            }
            for (let i = 0; i < 4; i++) {
                const enemy = this.charcters[i + 4];
                enemy.x = sd.enemyRespawnX - 10 + ((i % 2) * 20);
                enemy.y = sd.enemyRespawnY - 10 + (parseInt(i / 2) * 20);
            }
        },
        inkSetting: function () {
            this.inkContainer = new PIXI.Container();
            this.inkContainer.alpha = 0.7;

            this.allyInkMaskTexture = PIXI.RenderTexture.create(this.canvasWidth, this.canvasHeigth);
            const allyInkMaskSprite = new PIXI.Sprite(this.allyInkMaskTexture);
            this.app.stage.addChild(allyInkMaskSprite);
            const allyInkPaint = new PIXI.Sprite(PIXI.Texture.WHITE);
            allyInkPaint.x = 0;
            allyInkPaint.y = 0;
            allyInkPaint.width = this.canvasWidth;
            allyInkPaint.height = this.canvasHeigth;
            allyInkPaint.tint = this.allyColor;
            allyInkPaint.mask = allyInkMaskSprite;

            this.enemyInkMaskTexture = PIXI.RenderTexture.create(this.canvasWidth, this.canvasHeigth);
            const enemyInkMaskSprite = new PIXI.Sprite(this.enemyInkMaskTexture);
            this.app.stage.addChild(enemyInkMaskSprite);
            const enemyInkPaint = new PIXI.Sprite(PIXI.Texture.WHITE);
            enemyInkPaint.x = 0;
            enemyInkPaint.y = 0;
            enemyInkPaint.width = this.canvasWidth;
            enemyInkPaint.height = this.canvasHeigth;
            enemyInkPaint.tint = this.enemyColor;
            enemyInkPaint.mask = enemyInkMaskSprite;

            this.penColor = this.allyInkMaskTexture;
            this.eraseColor = this.enemyInkMaskTexture
            this.inkContainer.addChild(allyInkPaint, enemyInkPaint);

            this.app.stage.addChild(this.inkContainer);
        },
        inkPointerSetting: function () {
            const inkPointer = new PIXI.Container();
            const grp = new PIXI.Graphics();
            this.animateFuncs.set((mouseX, mouseY) => {
                grp.clear();
                grp.lineStyle(0);
                const color = this.penColor === this.allyInkMaskTexture ? this.allyColor : this.enemyColor;
                grp.beginFill(color);
                grp.drawCircle(mouseX, mouseY, this.penWeight);
                grp.endFill();
            });

            inkPointer
                .on('pointerdown', () => {
                    this.isPaint = true;
                    const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

                    this.lastPoint.x = mouseposition.x;
                    this.lastPoint.y = mouseposition.y;
                    this.nowPoint.x = mouseposition.x;
                    this.nowPoint.y = mouseposition.y;
                })
                .on('pointerup', () => {
                    this.isPaint = false;
                })
                .on('pointerupoutside', () => {
                    this.isPaint = false;
                })
                .on('pointermove', () => {
                    if (this.isPaint) {
                        const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

                        this.nowPoint.x = mouseposition.x;
                        this.nowPoint.y = mouseposition.y;
                    }
                })
                .on('pointerup', () => {
                });
            inkPointer.interactive = true;
            inkPointer.buttonMode = true;
            inkPointer.addChild(grp);
            this.app.stage.addChild(inkPointer);
        },
        buttonSetting: function () {

            const inkT = PIXI.Texture.from('img/circle.png');
            const buttonsContainer = new PIXI.Container();
            {
                let allyInkBtn = new PIXI.Sprite(inkT);
                allyInkBtn.interactive = true;
                allyInkBtn.buttonMode = true;
                allyInkBtn.tint = this.allyColor;
                allyInkBtn.x = 100;
                allyInkBtn.y = 700;
                allyInkBtn.scale.x = 0.4;
                allyInkBtn.scale.y = 0.4;
                allyInkBtn.anchor.set(0.5);
                allyInkBtn.on('pointerdown', () => {
                    //this.inkPointer.tint = allyInkBtn.tint;
                    this.penColor = this.allyInkMaskTexture;
                    this.eraseColor = this.enemyInkMaskTexture;
                });
                buttonsContainer.addChild(allyInkBtn);
            }
            {
                let enemyInkBtn = new PIXI.Sprite(inkT);
                enemyInkBtn.interactive = true;
                enemyInkBtn.buttonMode = true;
                enemyInkBtn.tint = this.enemyColor;
                enemyInkBtn.x = 200;
                enemyInkBtn.y = 700;
                enemyInkBtn.scale.x = 0.4;
                enemyInkBtn.scale.y = 0.4;
                enemyInkBtn.anchor.set(0.5);
                enemyInkBtn.on('pointerdown', () => {
                    //this.inkPointer.tint = enemyInkBtn.tint;
                    this.penColor = this.enemyInkMaskTexture;
                    this.eraseColor = this.allyInkMaskTexture;
                });
                buttonsContainer.addChild(enemyInkBtn);
            }
            this.app.stage.addChild(buttonsContainer);
        },
        wheelEvent: function (e) {

            if (this.touchCharacter) {
                this.touchCharacter.rotation += e.deltaY * 0.001;
            }
            else {
                this.penWeight += -e.deltaY * 0.01;
            }

            e.preventDefault();
        },
        keyEvent: function () {

            KeybordState.addKeyEvent("1", () => { this.moveCharacterFromMousePoint(0); });
            KeybordState.addKeyEvent("2", () => { this.moveCharacterFromMousePoint(1); });
            KeybordState.addKeyEvent("3", () => { this.moveCharacterFromMousePoint(2); });
            KeybordState.addKeyEvent("4", () => { this.moveCharacterFromMousePoint(3); });

            KeybordState.addKeyEvent("5", () => { this.moveObjFromMousePoint(); });

            KeybordState.addKeyEvent("6", () => { this.moveCharacterFromMousePoint(4); });
            KeybordState.addKeyEvent("7", () => { this.moveCharacterFromMousePoint(5); });
            KeybordState.addKeyEvent("8", () => { this.moveCharacterFromMousePoint(6); });
            KeybordState.addKeyEvent("9", () => { this.moveCharacterFromMousePoint(7); });

            KeybordState.addKeyEvent("q", () => { this.moveCharacterFromMousePoint(4); });
            KeybordState.addKeyEvent("w", () => { this.moveCharacterFromMousePoint(5); });
            KeybordState.addKeyEvent("e", () => { this.moveCharacterFromMousePoint(6); });
            KeybordState.addKeyEvent("r", () => { this.moveCharacterFromMousePoint(7); });

        },
        animate: function (delta) {

            const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

            for (const func of this.animateFuncs.keys()) {
                func(mouseposition.x, mouseposition.y);
            }

            this.inkPointer.x = mouseposition.x;
            this.inkPointer.y = mouseposition.y;

            if (this.isPaint) {

                this.paint();
                this.erase();

                this.lastPoint.x = mouseposition.x;
                this.lastPoint.y = mouseposition.y;
            }

        },

        paint: function () {
            const grp = this.drawLine(0xffffff);
            this.app.renderer.render(grp, this.penColor, false, null, false);
        },
        erase: function () {
            const grp = this.drawLine(0x000000);
            this.app.renderer.render(grp, this.eraseColor, false, null, false);
        },
        drawLine: function (color) {
            const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

            const grp = new PIXI.Graphics();
            grp.lineStyle(0);
            grp.beginFill(color);
            grp.drawCircle(mouseposition.x, mouseposition.y, this.penWeight);
            grp.endFill();

            grp.lineStyle(this.penWeight * 2, color);
            grp.moveTo(this.lastPoint.x, this.lastPoint.y);
            grp.lineTo(mouseposition.x, mouseposition.y);

            return grp;
        },

        inkClear: function () {
            const grp = new PIXI.Graphics();
            grp.beginFill(0x000000);
            grp.drawRect(0, 0, this.canvasWidth, this.canvasHeigth);
            grp.endFill();

            this.app.renderer.render(grp, this.penColor, false, null, false);
            this.app.renderer.render(grp, this.eraseColor, false, null, false);
        },
        moveCharacterFromMousePoint: function (charcterIndex) {
            const char = this.charcters[charcterIndex];
            const mouseposition = this.app.renderer.plugins.interaction.mouse.global;
            char.x = mouseposition.x;
            char.y = mouseposition.y;
        },
        moveObjFromMousePoint: function () {
            const mouseposition = this.app.renderer.plugins.interaction.mouse.global;
            this.obj.x = mouseposition.x;
            this.obj.y = mouseposition.y;
        },
        bringObj: function () {
            if (this.touchCharacter && KeybordState.isDown("Control")) {
                this.obj.x = this.touchCharacter.x;
                this.obj.y = this.touchCharacter.y + 15;
            }
        },
    }
});

function onDragStart(event) {
    this.data = event.data;
    this.dragging = true;
}

function onDragEnd() {
    this.dragging = false;
    this.data = null;
}

function onDragMove() {
    if (this.dragging) {
        const newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
    }
}