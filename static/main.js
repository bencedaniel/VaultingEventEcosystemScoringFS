function listCreator(searchInput, hiddenInput, list, items, icon) {
    if (!searchInput || !hiddenInput || !list) return;

    // Érvényes értékek (ha li-hez data-value/val van megadva, azt is figyelembe vesszük)
    const validValues = Array.from(items).map(i => (i.dataset.value ?? i.getAttribute('val') ?? i.textContent.trim()));

    // Keresés a listában
    function filterList(value) {
      const q = (value || '').toLowerCase();
      let hasVisible = false;
      items.forEach(item => {
        const show = item.textContent.toLowerCase().includes(q);
        item.style.display = show ? "block" : "none";
        if (show) hasVisible = true;
      });
      list.classList.toggle("d-none", !hasVisible);
    }

    // Open / close list
    function openList() {
      filterList('');
      list.classList.remove("d-none");
    }
    function closeList() {
      list.classList.add("d-none");
    }
    function toggleList() {
      if (list.classList.contains("d-none")) openList(); else closeList();
    }

    // Input events
    searchInput.addEventListener("input", (e) => filterList(e.target.value));
    searchInput.addEventListener("focus", () => openList());

    // Icon: make clickable and keyboard accessible
    if (icon) {
      icon.style.cursor = 'pointer';
      icon.setAttribute('role', 'button');
      icon.tabIndex = 0;
      icon.addEventListener("click", (e) => { e.stopPropagation(); toggleList(); });
      icon.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleList(); }
      });
    }

    // Listaelem kiválasztás
    items.forEach(item => {
      item.addEventListener("click", () => {
        const textvalue = item.textContent.trim();
        // Ha van data-value vagy val attribútum, azt használjuk a hidden input értékének,
        // különben a megjelenített szöveget (textvalue).
        const value = item.dataset.value ?? item.getAttribute('val') ?? textvalue;

        searchInput.value = textvalue;
        hiddenInput.value = value;
        closeList();
        // jelzés, ha más kód figyel a change eseményre
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Kattintás kívül → lista elrejtése (figyelembe vesszük az ikont is)
    document.addEventListener("click", function(e) {
      const target = e.target;
      const clickedInside = searchInput.contains(target) || list.contains(target) || (icon && icon.contains(target));
      if (!clickedInside) closeList();
    });

    // Form submit ellenőrzés → csak listaelem lehet
    const form = searchInput.closest('form');
    if (form) {
      form.addEventListener("submit", function(e) {
        const value = hiddenInput.value.trim();
        // validValues tartalmazza a megengedett értékeket (data-value vagy text)
        if (!validValues.includes(value)) {
          e.preventDefault();
          searchInput.classList.add('is-invalid');
          setTimeout(()=> searchInput.classList.remove('is-invalid'), 1200);
        }
      });
    }
  }





document.addEventListener('DOMContentLoaded', () => {

     const searchInput = document.getElementById('search');
    const tableBody = document.getElementById('TableBody');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownButton = document.getElementById('dropdownMenuButton');
    const cells = tableBody?.getElementsByTagName('th');
    const searchForm = document.getElementById('searchForm');
    var cellIndex = 0;


    if(tableBody){
    Array.from(cells).forEach((cell, index) => {
        console.log(cell.innerHTML);
        
        if (cell.innerHTML === '&nbsp;') return; 
        if (index === 0) {
            dropdownButton.innerHTML = cell.innerHTML;
        }
        const menuItem = document.createElement('a');
        menuItem.className = 'dropdown-item';
        menuItem.innerHTML = cell.innerHTML;
        menuItem.href = '#';
        dropdownMenu?.appendChild(menuItem);
        menuItem.addEventListener('click', fv => {
            const thisCellIndex = index;
            fv.preventDefault();
            let searchScope = fv.target.innerHTML;
            console.log('Selected column:'+ searchScope);
            dropdownButton.innerHTML = searchScope;
            console.log('Cell index:'+ thisCellIndex);
            cellIndex = thisCellIndex;


        });
        
    });
    };
    const form = document.getElementById('noSubmitForm'); // vagy .form-inline
    if( form ){
        form.addEventListener('submit', e => {
            e.preventDefault(); // megakadályozza az alapértelmezett submit-et
        });
    };

    dropdownButton?.addEventListener('click', fs => {
      searchInput.value = '';
      filterTable(fs);
    });


    searchInput?.addEventListener('input', fv => {
        filterTable(fv);
    }); 


    const togglewatcheds = document.querySelectorAll('.togglewatched');

    togglewatcheds.forEach(togglewatched => {
        togglewatched.addEventListener('click', async fv => {
            try{
            const movieId = togglewatched.value;
            const watched = togglewatched.checked;
            const response = await fetch('/togglewatched/' + movieId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ watched }) 
            });
        }catch (error) {
            console.error('Error toggling watched status:', error);
        };
            });

        
    });


    function filterTable(fv) {
              fv.preventDefault();
        const searchTerm = searchInput.value.toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');
        let visibleRowCount = 0;

        Array.from(rows).forEach((row, index) => {
            if (index === 0) return; // Skip header row
            const title = row.cells[cellIndex].textContent.toLowerCase();
            row.style.display = (title.includes(searchTerm)) ? '' : 'none';
            if (title.includes(searchTerm)) {
                row.style.display = '';
                if (searchTerm.length > 0){
                row.cells[cellIndex].innerHTML = row.cells[cellIndex].textContent.replace(new RegExp(searchTerm, 'gi'), match => `<span class="bg-warning">${match}</span>`);
                }else{
                row.cells[cellIndex].innerHTML = row.cells[cellIndex].textContent;}
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });

    }



    /* A Bootstrap Alert blokk eltüntetése */

    const rowElement = document.getElementById('alert-row');
    rowElement?.style && setTimeout(() => {
        let opacity = 1;
        const fadeOutInterval = setInterval(() => {
            if (opacity <= 0) {
                clearInterval(fadeOutInterval); // Animáció leállítása
                rowElement.remove(); // Elem eltávolítása a DOM-ból
            } else {
                opacity -= 0.1;
                rowElement.style.opacity = opacity;
            }
        }, 50); // 50ms intervallum a zökkenőmentes animációért
    }, 4000); // 4 másodperces késleltetés

    const successToastEl = document.getElementById('formSuccessToast');
    if (successToastEl) {
        const toast = new bootstrap.Toast(successToastEl, { delay: 3000 });
        toast.show();
    }

        const failToastEl = document.getElementById('formFailToast');
        if (failToastEl) {
        const toast = new bootstrap.Toast(failToastEl, { delay: 3000 });
        toast.show();
        }

  











});


  function ShowSuccessToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formSuccessToast" class="toast align-items-center text-white bg-success border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
    }
    function ShowErrorToast(message) {
        const toastContainer = document.getElementById('toastContainer');
        const toastHTML = `
            <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 9999;">
                <div id="formErrorToast" class="toast align-items-center text-white bg-danger border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                    ${message}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                </div>
            </div>
      `;
        toastContainer.innerHTML = toastHTML;

        setTimeout(() => {
            toastContainer.innerHTML = '';
        }, 3000);
    }


  document.addEventListener('DOMContentLoaded', () => {

      document.querySelectorAll('.searchable-dropdown').forEach(wrapper => {
        const input = wrapper.querySelector('.searchable-input');
        const hidden = wrapper.querySelector('.searchable-hidden');
        const list = wrapper.querySelector('.searchable-list');
        const items = list ? list.querySelectorAll('.searchable-item') : null;
        const icon = wrapper.querySelector('.bi-chevron-down');
        
        if (input && hidden && list && items && typeof listCreator === 'function') {
          listCreator(input, hidden, list, items, icon);
        }
      });
    
    });