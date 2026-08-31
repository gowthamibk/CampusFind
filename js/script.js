function filterItems() {

    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const typeFilter = document.getElementById("typeFilter");

    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedType = typeFilter.value;

    const items = document.querySelectorAll(".item-card");

    items.forEach(function(item) {

        const itemText = item.innerText.toLowerCase();
        const itemCategory = item.getAttribute("data-category");
        const itemType = item.getAttribute("data-type");

        const matchesSearch = itemText.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            itemCategory === selectedCategory;

        const matchesType =
            selectedType === "all" ||
            itemType === selectedType;

        if (matchesSearch && matchesCategory && matchesType) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }

    });
}