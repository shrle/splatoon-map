import KeybordState from "./keyboard.js";


let vm = new Vue({
    el: '#app',
    data: {
        stageData: {},
        rules: [
            { id: "nawabari", name: "ナワバリ" },
            { id: "area", name: "ガチエリア" },
            { id: "yagura", name: "ガチヤグラ" },
            { id: "hoko", name: "ガチホコ" },
            { id: "asari", name: "ガチアサリ" },
        ],
        stages:
            [
                { id: 'b_basu', name: 'Bバスパーク' },
                { id: 'azihurai', name: 'アジフライスタジアム' },
                { id: 'arowana', name: 'アロワナモール' },
                { id: 'antyobi', name: 'アンチョビットゲームズ' },
                { id: 'engawa', name: 'エンガワ河川敷' },
                { id: 'gangaze', name: 'ガンガゼ野外音楽堂' },
                { id: 'konbu', name: 'コンブトラック' },
                { id: 'zatou', name: 'ザトウマーケット' },
                { id: 'syotturu', name: 'ショッツル鉱山' },
                { id: 'sumesi', name: 'スメーシーワールド' },
                { id: 'tatiuo', name: 'タチウオパーキング' },
                { id: 'tyouzame', name: 'チョウザメ造船' },
                { id: 'debon', name: 'デボン海洋博物館' },
                { id: 'hakohugu', name: 'ハコフグ倉庫' },
                { id: 'battera', name: 'バッテラストリート' },
                { id: 'huzitubo', name: 'フジツボスポーツクラブ' },
                { id: 'hokke', name: 'ホッケふ頭' },
                { id: 'otoro', name: 'ホテルニューオートロ' },
                { id: 'manta', name: 'マンタマリア号' },
                { id: 'mutugo', name: 'ムツゴ楼' },
                { id: 'mozuku', name: 'モズク農園' },
                { id: 'mongara', name: 'モンガラキャンプ場' },
                { id: 'ama', name: '海女美術大学' }
            ]
        ,
        pickRule: "hoko",
        pickStage: "tatiuo",
        stage: {},// image
        stageSprite: {}, // PIXI.Sprite
        canvasWidth: 1280,
        canvasHeigth: 720,
        app: {}, // PIXI.Application
        container: {},// PIXI.Container
        animateFuncs: new Map(),

        obj: {}, // PIXI.Sprite
        objbg: {}, // PIXI.Sprite
        charcters: [], // PIXI.Container[]
        touchCharacter: null, // charcters[index]

        pickInkColor: {}, // allyInkMaskTexture or enemyInkMaskTexture
        eraseInkColor: {}, // // allyInkMaskTexture or enemyInkMaskTexture
        penWeight: 10,

        allyInkMaskTexture: {},
        enemyInkMaskTexture: {},

        inkContainer: {}, // PIXI.Container
        isPaint: false,
        allyColor: 0xebd244,
        enemyColor: 0x9b31ff,

        paintMode: "ink", // "ink" or "pen"
        penColor: "#D1FFDF",
        lastPoint: {},
        penClear: () => { },
    },
    watch: {
        pickRule: function () {
            this.loadStage(this.pickRule, this.pickStage);
        },
        pickStage: function () {
            this.loadStage(this.pickRule, this.pickStage);
        },
    },
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
        this.penPointerSetting();
        this.buttonSetting();
        this.charSetting();
        this.ruleObjSetting();
        this.loadStage(this.pickRule, this.pickStage);

        this.keyEvent();

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
            for (let i = 0; i < 4; i++) {
                const pContainer = this.createCharacter(this.allyColor, (i === 0));
                this.app.stage.addChild(pContainer);
                this.charcters.push(pContainer);
            }

            for (let i = 0; i < 4; i++) {
                const eContainer = this.createCharacter(this.enemyColor);
                this.app.stage.addChild(eContainer);
                this.charcters.push(eContainer);
            }
        },

        createCharacter: function (characterColor, isOwn) {
            const ownTextuer = PIXI.Texture.from('img/own-frame.png');
            const playerTexture = PIXI.Texture.from('img/player-frame.png');
            const playerMaskTextuer = PIXI.Texture.from('img/player-mask-a.png');

            const container = new PIXI.Container();
            container.x = 0;
            container.y = 0;

            const character = new PIXI.Sprite(isOwn ? ownTextuer : playerTexture);
            character.anchor.set(0.5);
            character.x = 0;
            character.y = 0;
            character.scale.x = 0.1;
            character.scale.y = 0.1;

            const characterMask = new PIXI.Sprite(playerMaskTextuer);
            characterMask.anchor.set(0.5);
            characterMask.x = 0;
            characterMask.y = 0;
            characterMask.scale.x = 0.1;
            characterMask.scale.y = 0.1;
            characterMask.tint = characterColor;

            container.addChild(characterMask, character);
            container.interactive = true;
            container.buttonMode = true;
            container.on('pointerdown', onDragStart)
                .on('pointerdown', () => {
                    this.touchCharacter = container;
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

            return container;
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

            this.pickInkColor = this.allyInkMaskTexture;
            this.eraseInkColor = this.enemyInkMaskTexture
            this.inkContainer.addChild(allyInkPaint, enemyInkPaint);

            this.app.stage.addChild(this.inkContainer);
        },
        inkPointerSetting: function () {
            const inkPointer = new PIXI.Container();
            const grp = new PIXI.Graphics();
            this.animateFuncs.set((mouseX, mouseY) => {
                grp.clear();
                if (this.touchCharacter || this.paintMode !== "ink") return;
                grp.lineStyle(0);
                const color = this.pickInkColor === this.allyInkMaskTexture ? this.allyColor : this.enemyColor;
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
                })
                .on('pointerup', () => {
                    this.isPaint = false;
                })
                .on('pointerupoutside', () => {
                    this.isPaint = false;
                })

            inkPointer.interactive = true;
            inkPointer.buttonMode = true;
            inkPointer.addChild(grp);
            this.app.stage.addChild(inkPointer);
            this.animateFuncs.set(this.inkPaint.bind(this));
        },
        penPointerSetting: function () {
            const penPointer = new PIXI.Container();
            const grp = new PIXI.Graphics();
            this.animateFuncs.set((mouseX, mouseY) => {
                grp.clear();
                if (this.touchCharacter || this.paintMode !== "pen") return;
                grp.lineStyle(0);
                const color = this.colorCodeToNumber(this.penColor);
                grp.beginFill(color);
                grp.drawCircle(mouseX, mouseY, this.penWeight);
                grp.endFill();
            });

            let isPaint = false;
            penPointer
                .on('pointerdown', () => {
                    isPaint = true;
                    const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

                    this.lastPoint.x = mouseposition.x;
                    this.lastPoint.y = mouseposition.y;
                })
                .on('pointerup', () => {
                    isPaint = false;
                })
                .on('pointerupoutside', () => {
                    isPaint = false;
                })

            penPointer.interactive = true;
            penPointer.buttonMode = true;
            penPointer.addChild(grp);
            const penPaint = new PIXI.Container();
            this.app.stage.addChild(penPaint, penPointer);
            this.animateFuncs.set(() => {
                if (!isPaint) return;
                const color = this.colorCodeToNumber(this.penColor);
                const draw = this.drawLine(color);
                penPaint.addChild(draw);
            });
            this.penClear = () => {
                penPaint.removeChildren();
            };
        },

        colorCodeToNumber: function (colorCode) {
            return parseInt(colorCode.substr(1), 16);
        },

        buttonSetting: function () {

            const inkT = PIXI.Texture.from('img/circle.png');
            const buttonsContainer = new PIXI.Container();
            {
                const allyInkBtn = new PIXI.Sprite(inkT);
                allyInkBtn.interactive = true;
                allyInkBtn.buttonMode = true;
                allyInkBtn.tint = this.allyColor;
                allyInkBtn.x = 100;
                allyInkBtn.y = 700;
                allyInkBtn.scale.x = 0.4;
                allyInkBtn.scale.y = 0.4;
                allyInkBtn.anchor.set(0.5);
                allyInkBtn.on('pointerdown', this.pickAllyInk.bind(this));
                buttonsContainer.addChild(allyInkBtn);
            }
            {
                const enemyInkBtn = new PIXI.Sprite(inkT);
                enemyInkBtn.interactive = true;
                enemyInkBtn.buttonMode = true;
                enemyInkBtn.tint = this.enemyColor;
                enemyInkBtn.x = 200;
                enemyInkBtn.y = 700;
                enemyInkBtn.scale.x = 0.4;
                enemyInkBtn.scale.y = 0.4;
                enemyInkBtn.anchor.set(0.5);
                enemyInkBtn.on('pointerdown', this.pickEnemyInk.bind(this));
                buttonsContainer.addChild(enemyInkBtn);
            }
            {
                const penIconTexture = PIXI.Texture.from('img/pen.png');
                const penIconSprite = new PIXI.Sprite(penIconTexture);
                penIconSprite.interactive = true;
                penIconSprite.buttonMode = true;
                penIconSprite.x = 300;
                penIconSprite.y = 695;
                penIconSprite.scale.x = 0.2;
                penIconSprite.scale.y = 0.2;
                penIconSprite.anchor.set(0.5);
                penIconSprite.on('pointerdown', this.pickPen.bind(this));
                buttonsContainer.addChild(penIconSprite);
            }
            this.app.stage.addChild(buttonsContainer);
        },
        pickPen: function () {
            this.paintMode = "pen";
        },
        pickAllyInk: function () {
            this.paintMode = "ink";
            this.pickInkColor = this.allyInkMaskTexture;
            this.eraseInkColor = this.enemyInkMaskTexture;
        },
        pickEnemyInk: function () {
            this.paintMode = "ink";
            this.pickInkColor = this.enemyInkMaskTexture;
            this.eraseInkColor = this.allyInkMaskTexture;
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

            KeybordState.addKeyEvent("a", this.pickAllyInk.bind(this));
            KeybordState.addKeyEvent("b", this.pickEnemyInk.bind(this));
            KeybordState.addKeyEvent("c", this.pickPen.bind(this));

        },
        animate: function (delta) {

            const mouseposition = this.app.renderer.plugins.interaction.mouse.global;

            for (const func of this.animateFuncs.keys()) {
                func(mouseposition.x, mouseposition.y);
            }
            this.lastPoint.x = mouseposition.x;
            this.lastPoint.y = mouseposition.y;
        },


        inkPaint: function (mouseX, mouseY) {
            if (this.isPaint) {

                const drawGrp = this.drawLine(0xffffff);
                this.app.renderer.render(drawGrp, this.pickInkColor, false, null, false);
                const eraseGrp = this.drawLine(0x000000);
                this.app.renderer.render(eraseGrp, this.eraseInkColor, false, null, false);

            }
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

            this.app.renderer.render(grp, this.pickInkColor, false, null, false);
            this.app.renderer.render(grp, this.eraseInkColor, false, null, false);
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