import A11yDialog from 'https://cdn.jsdelivr.net/npm/a11y-dialog@^7.5.2/dist/a11y-dialog.esm.js'

export { Carousel };

function Carousel(carouselElem) {
  debugger;
  this.dialog = new A11yDialog(document.getElementById("carousel-dialog"));
  this.carouselElem = carouselElem;
  this.slidesUl = carouselElem.querySelector("#slides");
  this.prevLink = carouselElem.querySelector("#prevLink");
  this.nextLink = carouselElem.querySelector("#nextLink");
  this.closeButton = carouselElem.querySelector("#closeButton");

  const { currentIndex, isOpen } = getCarouselState();
  this.currentIdx = currentIndex;
  this.isOpen = isOpen;

  this.slidesUl.children[this.currentIdx]?.classList.add(
    "carousel__slide--visible"
  );

  this.changeCurrentSlide(this.currentIdx, currentIndex);

  if (this.isOpen) {
    this.open(this.currentIdx);
  }

  addEvents.call(this);
}

Carousel.prototype.open = function (index = undefined) {
  document.documentElement.style.overflow = "hidden";
  this.carouselElem.classList.add("carousel--active");
  this.dialog.show();
  this.isOpen = true;
  updateCarouselUrl(index);
  debugger;
};

Carousel.prototype.close = function () {
  document.documentElement.style.overflow = "auto";
  this.carouselElem.classList.remove("carousel--active");
  this.dialog.hide();
  this.isOpen = false;
  updateCarouselUrl();
};

Carousel.prototype.changeCurrentSlide = function (oldIdx, newIdx) {
  if (newIdx > this.slidesUl.childElementCount) {
    this.close();
    return;
  }

  loadImage(this.slidesUl.children[newIdx]?.firstElementChild);

  if (newIdx < this.slidesUl.children.length - 1 && oldIdx < newIdx) {
    loadImage(this.slidesUl.children[newIdx + 1]?.firstElementChild);
  } else {
    loadImage(this.slidesUl.children[newIdx - 1]?.firstElementChild);
  }

  this.slidesUl.children[newIdx].classList.add("carousel__slide--visible");

  if (newIdx !== oldIdx) {
    this.slidesUl.children[oldIdx].classList.remove("carousel__slide--visible");
  }

  this.currentIdx = newIdx;

  this.prevLink.href = getPrevLink(
    this.currentIdx,
    this.slidesUl.childElementCount
  );
  this.nextLink.href = getNextLink(
    this.currentIdx,
    this.slidesUl.childElementCount
  );
};

function addEvents() {
  this.prevLink.addEventListener("click", goToPrev(this));
  this.nextLink.addEventListener("click", goToNext(this));
  this.closeButton.addEventListener("click", closeCarousel(this));

  this.dialog.on("hide", () => {
    this.close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowRight") {
      goToNext(this)(e);
    }
    if (e.key == "ArrowLeft") {
      goToPrev(this)(e);
    }
    if (e.key == "Escape") {
      closeCarousel(this)(e);
    }
  });

  window.addEventListener("popstate", updateCurrentSlide(this));

  function updateCurrentSlide(carousel) {
    return function handleUpdate(e) {
      const { currentIndex, isOpen } = getCarouselState();
      if (isOpen) {
        carousel.changeCurrentSlide(carousel.currentIdx, currentIndex);
      }
    };
  }

  function goToPrev(carousel) {
    return function handlePrev(e) {
      e.preventDefault();
      const index = getPrevIndex(
        carousel.currentIdx,
        carousel.slidesUl.childElementCount
      );
      updateCarouselUrl(index);
    };
  }

  function goToNext(carousel) {
    return function handleNext(e) {
      e.preventDefault();
      const index = getPrevIndex(
        carousel.currentIdx,
        carousel.slidesUl.childElementCount
      );
      updateCarouselUrl(index);
    };
  }

  function closeCarousel(carousel) {
    return function handleClose(e) {
      carousel.close();
    };
  }
}

function loadImage(img) {
  if (img && (!img.src || img.src.includes("placeholder"))) {
    img.src = img.dataset.src;
  }
}

function getPrevLink(currentIndex, totalItems) {
  const index = getPrevIndex(currentIndex, totalItems);
  return window.location.href.replace(/\?image=*/, `?image=${index}`);
}

function getNextLink(currentIndex, totalItems) {
  const index = getNextIndex(currentIndex, totalItems);
  return window.location.href.replace(/\?image=*/, `?image=${index}`);
}

function getPrevIndex(currentIndex, totalItems) {
  let index = currentIndex;
  if (currentIndex - 1 < 0) {
    index = totalItems - 1;
  } else {
    index = currentIndex - 1;
  }
  return index;
}

function getNextIndex(currentIndex, totalItems) {
  let index = currentIndex;
  if (currentIndex + 1 > totalItems - 1) {
    index = 0;
  } else {
    index = currentIndex + 1;
  }
  return index;
}

function getCarouselState() {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const currentIndex = Number(params.image ?? 0);
  const isOpen = Boolean(params.image);
  return { currentIndex, isOpen };
}

function updateCarouselUrl(value = undefined) {
  const url = new URL(window.location.href);
  if (value == null) {
    url.searchParams.delete("image");
  } else {
    url.searchParams.set("image", String(value));
  }
  window.history.pushState({}, "", url);

  // To be able to listen to popstate events window.addEventListener('popstate')
  const popStateEvent = new PopStateEvent("popstate", {});
  dispatchEvent(popStateEvent);
}
