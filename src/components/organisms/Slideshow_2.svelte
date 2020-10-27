<script>
  import Button from "../atoms/Button.svelte";

  export let data = [];
  let selected = false;

  let viewport;
  let indicator;
  let scrollable;
  $: slider = 0;
  $: sliderScroll = 0;
  let dragStart = 0;

  const handleScroll = (e) => {
    let scrolledPercent =
      (e.target.scrollLeft / (scrollable.scrollWidth - viewport.offsetWidth)) *
      100;
    sliderScroll =
      ((viewport.offsetWidth - slider.offsetWidth) / viewport.offsetWidth) *
      scrolledPercent;
  };

  const handleStartDrag = (e) => {
    selected = true;
    dragStart = e.clientX;
  };

  const handleDrag = (e) => {
    sliderScroll = (e.clientX - dragStart) / 2;
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

    &:after {
      content: "";
      position: absolute;
      top: 20.5rem;
      left: 0;
      width: 100%;
      height: 2rem;
      background: $color-white;
    }
  }

  .image-rail {
    width: 100%;
    height: 22.375rem;
    padding: 1rem 0;
    overflow-y: hidden;
    overflow-x: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

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
    height: 0.125rem;
    background: $color-light-gray;
    cursor: pointer;

    &:hover {
      bottom: 0.4375rem;
      height: 0.25rem;
    }

    &__slider {
      position: absolute;
      bottom: 0;
      height: 100%;
      background: $color-gray-900;
      cursor: grab;

      &--selected {
        height: 140%;
        bottom: -20%;
      }
    }
  }
</style>

<div class="slideshow" bind:this={viewport}>
  <div class="image-rail" on:scroll={handleScroll} bind:this={scrollable}>
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
  <div class="indicator" bind:this={indicator}>
    <div
      style={`left: ${sliderScroll}%; width: ${200 / data.length}%`}
      class="indicator__slider"
      class:indicator__slider--selected={selected}
      bind:this={slider}
      on:mousedown={handleStartDrag}
      on:drag={handleDrag}
      on:mouseup={() => (selected = false)}
      on:mouseleave={() => (selected = false)} />
  </div>
</div>
