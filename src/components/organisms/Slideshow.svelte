<script>
  import Button from "../atoms/Button.svelte";

  export let data = [];
  let rail;
  let selected = false;
  $: scrolled = 0;

  const handleScroll = (e) => {
    let v = e.target.offsetWidth,
      w = e.target.scrollWidth,
      s = e.target.scrollLeft,
      x = (s / (w - v)) * 100;

    if (
      x.toFixed(1) - Math.floor(x) === 0 ||
      (x.toFixed(1) - Math.floor(x) >= 0.25 &&
        x.toFixed(1) - Math.floor(x) < 0.75)
    ) {
      scrolled = x.toFixed(1);
    } else if (x.toFixed(1) - Math.floor(x) < 0.25) {
      scrolled = Math.floor(x);
    } else {
      scrolled = Math.ceil(x);
    }
  };

  const handleSlider = () => {
    let step = (rail.scrollWidth - rail.offsetWidth) / 100;
    let x = scrolled * step;
    rail.scrollLeft = x;
  };
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .slideshow {
    position: relative;
    width: 100%;
    height: 24rem;
    padding-bottom: 1rem;
    overflow: hidden;
    background: $color-white;
  }

  .image-rail {
    width: 100%;
    height: 22.375rem;
    padding: 1rem 0;
    overflow-y: hidden;
    overflow-x: scroll;

    &__container {
      display: flex;
      flex-flow: row nowrap;
    }
  }

  .image {
    position: relative;
    min-width: 14.375rem;
    width: 14.375rem;
    height: 19.3125rem;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;

    &:not(:first-of-type) {
      margin-left: 1rem;
    }

    &__btn {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }
  }

  .indicator {
    position: absolute;
    left: 0;
    bottom: 0.5rem;
    width: 100%;
    height: 2.5rem;
    background: $color-white;

    .slider {
      @include hide-slider;
      -webkit-appearance: none;
      width: 100%;

      &:focus {
        outline: none;
      }

      &::-webkit-slider-runnable-track {
        width: 100%;
        height: 0.125rem;
        cursor: pointer;
        background: $color-light-gray;
      }

      &::-webkit-slider-thumb {
        height: 0.125rem;
        width: 10rem;
        background: $color-black;
        cursor: pointer;
        -webkit-appearance: none;
      }

      &:focus::-webkit-slider-runnable-track {
        background: $color-light-gray;
      }
      &::-moz-range-track {
        width: 100%;
        height: 0.125rem;
        cursor: pointer;
        background: $color-light-gray;
      }
      &::-moz-range-thumb {
        height: 0.125rem;
        width: 10rem;
        background: $color-black;
        border: none;
        cursor: pointer;
      }
    }
  }
</style>

<div class="slideshow">
  <div class="image-rail" on:scroll={handleScroll} bind:this={rail}>
    <div class="image-rail__container">
      {#each data as image}
        <div class="image" style={`background-image: url(${image.src})`}>
          <div class="image__btn">
            <Button tertiary>{image.text}</Button>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="indicator">
    <input
      class="slider"
      type="range"
      min="0"
      max="100"
      step="0.5"
      bind:value={scrolled}
      on:input={handleSlider} />
  </div>
</div>
