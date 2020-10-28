<script>
  import Button from "../atoms/Button.svelte";

  export let data = [];
  export let type = "images";
  export let showMax = data.length || 0;
  export let noSlider = false;
  export let imageOnly = false;
  $: maxOnLoad = showMax;
  let rail;
  let selected = false;
  $: scrolled = 0;

  // range props
  export let min = 0;
  export let max = 100;
  export let step = 0.5;

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
    padding-bottom: 1rem;
    overflow: hidden;
    background: $color-white;

    &--images {
      height: 24rem;
    }
    &--buttons {
      height: 7rem;
    }
  }

  .image-rail {
    width: 100%;
    height: 97%;
    padding: 1rem 0;
    overflow-y: hidden;
    overflow-x: scroll;

    &__container {
      display: flex;
      flex-flow: row nowrap;

      .btn-container {
        &:not(:first-of-type) {
          margin-left: 0.5rem;
        }
      }
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

      &--hide {
        display: none;
      }
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

<div
  class="slideshow"
  class:slideshow--images={type === 'images'}
  class:slideshow--buttons={type === 'buttons'}>
  <div class="image-rail" on:scroll={handleScroll} bind:this={rail}>
    <div class="image-rail__container">
      {#if type === 'images'}
        {#each data as image}
          <div class="image" style={`background-image: url(${image.src})`}>
            <div class="image__btn" class:image__btn--hide={imageOnly}>
              <Button tertiary>{image.text}</Button>
            </div>
          </div>
        {/each}
      {:else if type === 'buttons'}
        {#each data as button, i}
          {#if i < maxOnLoad}
            <div class="btn-container">
              <Button tertiary small>{button.text}</Button>
            </div>
          {/if}
        {/each}
        {#if maxOnLoad < data.length}
          <div class="btn-container">
            <Button tertiary small on:click={() => (maxOnLoad = data.length)}>
              {`${data.length - maxOnLoad}+ more`}
            </Button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <div class="indicator">
    {#if !noSlider}
      <input
        class="slider"
        type="range"
        {min}
        {max}
        {step}
        bind:value={scrolled}
        on:input={handleSlider} />
    {/if}
  </div>
</div>
