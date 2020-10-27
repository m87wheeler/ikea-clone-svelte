<script>
  export let value;
  export let min = 0;
  export let max = 100;
  export let step = 0.5;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

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

<div class="indicator">
  <input class="slider" type="range" {min} {max} {step} {value} on:input />
</div>
