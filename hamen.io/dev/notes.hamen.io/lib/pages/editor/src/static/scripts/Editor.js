class Caret {
    /**
     * 
     * @param {HTMLElement} where 
     */
    constructor(where) {
        this.UUID = "_" + UUID();

        const _UUID = this.UUID;
        this.appendTo(document.querySelector("body>main#app #editor>.document>#document"));
        const element = () => document.querySelector(`.caret[uuid=${_UUID}]`);
        this.element = () => element();

        this.position = {
            get x() { return element().getBoundingClientRect().left },
            set x(location) { element().style.left = location + "px"; },
            get y() { return element().getBoundingClientRect().left },
            set y(location) { element().style.top = location + "px"; },
        }

        this.size = {
            get height() { return element().getBoundingClientRect().height },
            set height(height) { element().style.height = height + "px" }
        }

        this.offsetX = 4;
        this.watchElement = where;
        this.repositionTo(where);

        this.onDestroy = new SubscriptionList();

        /**
         * @type {number[]}
         */
        this.timeoutList = [];

        /** 
         * When false, the caret will not do its blinking animation and will remain a black solid line
         * 
         * @type {boolean}
         */
        this.doBlinking = true;

        this.isHidden = false;

        /**
         * The `setInterval` responsible for creating the caret's blinking animation
         */
        const blinkingInterval = setInterval(() => {
            const elem = element();
            if (this.doBlinking && !this.isHidden && elem) {
                elem.classList.toggle("hidden");
            } else {
                elem.classList.remove("hidden");
            }
        }, $_DEFAULTS.EDITOR.CARET.BLINKING_SPEED_INTERVALS);

        this.onDestroy.subscribe(() => this.timeoutList.forEach(id => clearTimeout(id)));
        this.onDestroy.subscribe(() => clearInterval(blinkingInterval));

        // Stop blinking on document keypress
        //    note: blinking resumes after `resumeAfter` milliseconds
        window.addEventListener("keydown", () => {
            /** @type {number} The amount of time to resume blinking after. */
            const resumeAfter = 400;

            const onKeyUp = e => window.removeEventListener("keyup", onKeyUp);

            this.timeoutList.forEach(id => clearTimeout(id));
            this.doBlinking = false;
            element().classList.remove("hidden");
            const timeout = setTimeout(() => {
                this.doBlinking = true;
            }, resumeAfter);

            this.timeoutList.push(timeout);

            window.addEventListener("keyup", onKeyUp);
        })

        Application.States.Window.focusedWindow.onChange.subscribe((nV) => this.isHidden = nV === "DOCUMENT");

        this.refresh();
    }

    hide() {
        this.isHidden = true;
        this.refresh()
    }
    
    show() {
        this.isHidden = false;
        this.refresh()
    }

    appendTo(parentElement) {
        const caret = document.createElement("div");
        caret.setAttribute("uuid", this.UUID)
        caret.classList.add("caret");

        parentElement.appendChild(caret);
    }

    destroyCaret() {
        this.onDestroy.trigger();
        this.element().remove();
    }

    /**
     * Repositions the caret to AFTER a given element
     * 
     * @param {HTMLElement} element 
     */
    repositionTo(element) {
        if (!element) return;

        this.watchElement = element;
        this.refresh();
    }

    refresh() {
        const element = this.watchElement;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const height = box.height - parseFloat(style.marginTop) - parseFloat(style.marginBottom);
        this.position.x = box.left + box.width;
        this.position.y = box.top;
        this.size.height = height;
    }
}

class UserProperty {
    constructor(propertyName) {
    }
}

class BoundingBox {
    constructor(posX, posY, dimX, dimY) {
        this.posX = posX;
        this.posY = posY;
        this.dimX = dimX;
        this.dimY = dimY;
    }
}

/**
 * Points to a given element in the document
 */
class ElementPointer {
    constructor() {
        this.boundingBox = new BoundingBox(0, 0, 0, 0);
    }

    destroyElement() {

    }
}

class EditorAPI {
    constructor() {
        /**
         * @type {Caret[]}
         */
        this.additionalCarets = [];

        const placeholderParagraph = this.insertParagraph({
            textContent: "“In a mad world, only the mad are sane”",
            activateCaret: false
        });

        this.activeCaret = new Caret(placeholderParagraph.lastElementChild);
        this.activeCaret.hide();

        this.getCarets = () => [this.activeCaret, ...this.additionalCarets];

        this.editorDocument.addEventListener("blur", () => this.activeCaret.hide());
        this.editorDocument.addEventListener("focus", () => this.activeCaret.show());
        this.editorDocument.addEventListener("click", () => this.activeCaret.show());

        // Add the actual writing functionality; insert character on keypress
        window.addEventListener("keydown", e => {
            if (Application.States.Window.focusedWindow.getValue() === "DOCUMENT") {
                if (e.key === "Backspace") {
                    this.performBackspace();
                }
                
                // Insert normal key
                else if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                    const ignoreKeys = ["Control", "Alt", "Meta", "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Backspace", "Shift", "Escape"]
                        .map(k => k.toLowerCase());
                    const longKeys = []
                        .map(k => k.toLowerCase());
                    const key = e.key
                        .toLocaleLowerCase();
    
                    if (
                        !ignoreKeys.includes(key)
                    ) {
                        if (key.length > 1 && !longKeys.includes(key)) {
                            console.warn("REQUESTED KEY NOT BLACKLISTED NOR WHITELISTED: ", key);
                        } else {
                            this.insertChar(key);
                        }
                    }
                }
            }
        })
    }

    /**
     * 
     * @param {"LEFT" | "RIGHT" | "UP" | "DOWN"} to 
     */
    moveCaret(to) {
        const caretList = [
            this.activeCaret,
            ...this.additionalCarets
        ];

        caretList.forEach(caret => {
            let targetElement = null;
            switch (to) {
                case "LEFT":
                    targetElement = caret.watchElement.previousElementSibling;
                    if (targetElement) {
                        caret.repositionTo(targetElement);
                    };
                    break;
                case "RIGHT":
                    targetElement = caret.watchElement.nextElementSibling;
                    if (targetElement) {
                        caret.repositionTo(targetElement);
                    };
                    break;
            };
        });
    }

    /**
     * Inserts a character at the user's cursor(s)
     * 
     * @param {string} charValue
     * @param {{
     *  fontWeight: "LIGHT" |"NORMAL" | "BOLD" | "BLACK",
     *  fontFamily: string[],
     *  fontSize: number,
     *  textColor: string
     * }} options
     */
    insertChar(charValue, options = {
        fontWeight: 400,
        fontFamily: ["Poppins", "sans-serif"],
        fontSize: 13,
        textColor: "hsl(0, 0%, 30%)"
    }) {
        const char = document.createElement("span");
        char.classList.add("doc:char", "doc:element");

        charValue = formatChar(charValue);
        if (isEntity(charValue)) {
            char.innerHTML = charValue
        } else {
            char.innerText = charValue;
        }

        char.style.fontWeight = useDefault(options.fontWeight, 400) + "";
        char.style.fontFamily = useDefault(options.fontFamily, ["Poppins", "sans-serif"]).join(", ");
        char.style.fontSize = useDefault(options.fontSize, 13) + "px";
        char.style.color = useDefault(options.textColor, "hsl(0, 0%, 30%)");

        this.getCarets().forEach(caret => {
            const c = caret.watchElement.insertAdjacentElement("afterend", char);
            caret.repositionTo(c);
        })
    }

    performBackspace() {
        this.getCarets().forEach(caret => {
            const targetElement = caret?.watchElement;
            const newElement = targetElement?.previousElementSibling || targetElement?.nextElementSibling;
            if (targetElement && newElement.classList.contains("doc:element") && !targetElement.classList.contains("doc:frozen-char")) {
                targetElement.remove();
                caret.repositionTo(newElement);
            }
        })
    }

    /**
     * 
     * 
     * @param {{
     *  textContent: string,
     *  activateCaret: boolean
     * }} options
     */
    insertParagraph(options = {
        textContent: "",
        activateCaret: true
    }) {
        options.textContent = useDefault(options.textContent, "");
        options.activateCaret = useDefault(options.activateCaret, true);

        options.textContent = " " + options.textContent;

        const p = document.createElement("p");
        p.classList.add("doc:p");

        // Insert the initial text
        for (let i = 0; i < options.textContent.length; i++) {
            const charValue = formatChar(options.textContent[i]);
            const char = document.createElement("span");
            char.classList.add("doc:char", "doc:element");

            if (i === 0) {
                char.classList.add("doc:frozen-char");
                char.innerHTML = "&zwj;"
            } else if (isEntity(charValue)) {
                char.innerHTML = charValue
            } else {
                char.innerText = charValue
            }

            p.appendChild(char);
        };

        this.editorDocument.appendChild(p);

        if (options.activateCaret) this.activeCaret.repositionTo(p.lastElementChild);

        return p;
    }

    get editorDocument() {
        return document.querySelector("body>main#app #editor>.document>#document");
    }
}

class Editor {
    constructor() {
        Application.Keyboard.Hotkeys.registerHotkey("MAC", { key: "e", metaKey: true }, () => this.actionBarExpanded = !this.actionBarExpanded);
        Application.Keyboard.Hotkeys.registerHotkey("WIN", { key: "e", ctrlKey: true }, () => this.actionBarExpanded = !this.actionBarExpanded);

        this._documentName = "";

        this.openDialog = {
            renameDocumentDialog: () => {
                const input = document.createElement("input");
                input.type = "text";
                input.value = this.documentName;

                const button = document.createElement("button");
                button.type = "button";
                button.innerText = "Rename!";

                const dialog = PageAlerts.createDialog(
                    {
                        title: "Rename Document"
                    },
                    () => [input, button]
                )

                dialog.show().then(() => {
                    input.select();
                    input.focus();

                    const handleSubmission = (e) => {
                        if (!e?.key || e?.key === "Enter") {
                            this.documentName = input.value;
                            button.removeEventListener("click", handleSubmission)
                            window.removeEventListener("keydown", handleSubmission)
                            // $(window.document).ready(function () {
                            //     $(renameDialogButton).click(function () {
                            //         var data = {
                            //             documentName: renameDialog.querySelector("input").value
                            //         };

                            //         $.ajax({
                            //             type: "POST",
                            //             url: "./",
                            //             data: data,
                            //             success: function (response) {  },
                            //             error: function (error) {
                            //                 alert()
                            //             }
                            //         });
                            //     });
                            // });

                            dialog.hide(true);
                        }
                    }

                    button.addEventListener("click", handleSubmission)
                    window.addEventListener("keydown", handleSubmission)
                })
            }
        };

        /**
         * @type {EditorEventList}
         */
        this.eventListeners = {
            "DocumentName": []
        };

        this.Editor = new EditorAPI();

        // MAC Shortcuts
        Application.Keyboard.Hotkeys.registerHotkey("MAC", { key: "‰", altKey: true, shiftKey: true }, () => this.openDialog.renameDocumentDialog());
        const editorFocused = () => this?.Editor?.editorDocument?.classList?.contains("focused") ? true : false;
        Application.Keyboard.Hotkeys.registerHotkey("MAC", { key: "ArrowLeft" }, () => this.Editor.moveCaret("LEFT"), editorFocused);
        Application.Keyboard.Hotkeys.registerHotkey("MAC", { key: "ArrowRight" }, () => this.Editor.moveCaret("RIGHT"), editorFocused);
    }

    /**
     * Listens for a given event
     * 
     * @param {EditorEvents} event The name of the event
     * @param {(nV, oV) => void} callback A callback function to be called when the event is triggered. Depending on the event, the callback should take: `(nV, oV)`, or `(newValue, oldValue)`—respectively
     */
    addEventListener(event, callback) {
        this.eventListeners[event].push(callback)
    }

    /**
     * 
     * @param {EditorEvents} event The event to be triggered
     * @param  {...any} args Additional parameters to be passed to the callback
     */
    triggerEventListener(event, ...args) {
        this.eventListeners[event].forEach(c => c(...args))
    }

    /**
     * Syncs this class to the DOM by adding DOM event listeners, class event listeners, additional functionality, etc.
     */
    init() {
        // Set document name
        const documentNameInput = window.document.querySelector("input#document\\:name");
        documentNameInput.value = this.documentName;
        this.addEventListener("DocumentName", (nV, oV) => { documentNameInput.value = nV });
        documentNameInput.addEventListener("input", () => this.documentName = documentNameInput.value);
        documentNameInput.addEventListener("keydown", e => e?.key === "Enter" ? documentNameInput.blur() : "");
    }

    /**
     * Returns the set document/note name
     * 
     * @returns {string}
     */
    get documentName() {
        return this._documentName
    }

    /**
     * Changes the document/note name
     * 
     * When changed, the `DocumentName` event listener will be triggered
     * 
     * @param {string} name The new name of the document
     * @returns {void}
     */
    set documentName(name) {
        this.triggerEventListener("DocumentName", (name, this._documentName));
        this._documentName = name;
        window.document.querySelector("#document\\:name").value = name;
    }

    get actionBarExpanded() {
        return document.querySelector("#action-menu").getAttribute("expanded") !== null
    }

    set actionBarExpanded(value) {
        if (![true, false].includes(value)) {
            return console.error(
                `Cannot evaluate value : '${value}' (of type : '${typeof value}') when expected type is 'boolean'`
            );
        }

        value ?
            document.querySelector("#action-menu").setAttribute("expanded", true) :
            document.querySelector("#action-menu").removeAttribute("expanded");
    }
}
