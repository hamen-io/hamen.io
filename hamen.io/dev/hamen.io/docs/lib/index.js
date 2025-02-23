class CardItem {
    constructor(title = "", author = "", date = "", tags = [], color = "BLUE", url = "") {
        this._title = title;
        this._author = author;
        this._date = date;
        this._tags = tags;
        this._color = color;
        this._url = url;
        this._visible = true;
        this.card = document.createElement("article");
        this.card.classList.add("result");
        this.card.setAttribute("bg-color", this._color);
        this.card.addEventListener("click", () => window.location.assign(this._url));
        this.card.innerHTML = `<div class="image"></div><div class="body"><p class="tags">${this._tags.map(tag => "<span class=\"tag\">" + tag + "</span>").join(" » ")}</p><h3 class="title">${this._title}</h3><p class="author-date"><span class="date">${this._date}</span><span class="author">by&nbsp;<span class="author-name">${this._author}</span></span></p></div>`;
        this.card.setAttribute("content", Array.from(new Set(this.card.innerText.split(/([\s]|[^a-zA-Z0-9])/g))).filter(x => x.trim()).map(x => x.toLowerCase()))
    };

    get color() { return this._color; }
    set color(_color) { this._color = _color;this.card.setAttribute("bg-color", _color); };
    get title() { return this._title; }
    set title(_title) { this._title = _title;this.card.querySelector(".title").innerHTML = _title; };
    get author() { return this._author; }
    set author(_author) { this._author = _author;this.card.querySelector(".author-name").innerHTML = _author; };
    get date() { return this._date; }
    set date(_date) { this._date = _date;this.card.querySelector(".date").innerHTML = _date; };
    get visible() { return this._visible; }
    set visible(_visible) { this._visible = _visible;if (_visible) { this.card.classList.add("visible"); } else { this.card.classList.remove("visible"); } }
    appendTag(tagName) { this._tags.push(tagName); }
    appendTags(...tagName) { this._tags.push(...tagName); }
};

const addArticles = async () => {
    const fetchArticles = async () => {
        const response = await fetch("https://www.hamen.io/artifacts/docs/manifest.json");
        if (response.ok) {
            return response.json();
        };
    };

    fetchArticles()?.then(articles => {
        let results = document.querySelector(".results");
        articles.forEach(articleData => {
            if (articleData["showInFeed"] != false) {
                let article = new CardItem(
                    articleData.articleTitle,
                    articleData.articleAuthor,
                    articleData.articleDate["published"],
                    articleData.articleBreadcrumbs.split(",").map(x => x.trim()),
                    (articleData.articleType || "BLOG") === "BLOG" ? "BLUE" : "GREEN",
                    articleData.articlePathURL
                );
    
                results.appendChild(article.card);
            }
        });
    });
};

window.addEventListener("DOMContentLoaded", () => {
    addArticles();

    Array.from(document.querySelectorAll(".expanded-items")).forEach(expandedItem => {
        let expandedItems = Array.from(expandedItem.querySelectorAll("li"));
        let categories = Array.from(expandedItem.parentElement.querySelectorAll(".expanded-content"));
    
        expandedItems.forEach(item => {
            item.addEventListener("click", () => {
                console.assert(item.getAttribute("content-target"), "Missing content target.");
    
                // De-select all items:
                expandedItems.forEach(_item => _item.classList.remove("selected"))
    
                // Hide all expanded content:
                categories.forEach(category => {
                    if (category.getAttribute("content-id") === item.getAttribute("content-target")) {
                        if (!category.classList.contains("visible")) {
                            category.classList.add("visible");
                            item.classList.add("selected");
                        } else {
                            category.classList.remove("visible");
                            item.classList.remove("selected");
                        }
                    } else {
                        category.classList.remove("visible");
                    }
                });
            })
        })
    })
})