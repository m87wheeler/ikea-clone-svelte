<script>
  import { propTypes } from "../../assets/PropTypes";

  export let x = 0;
  export let y = 0;
  propTypes(y, "number");
  propTypes(x, "number");
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .pointer {
    position: absolute;
    width: 2rem;
    height: 2rem;
    border: 2px solid transparent;
    border-radius: 100%;
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: border 0.25s ease-in-out;

    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
      width: 0.875rem;
      height: 0.875rem;
      background: $color-white;
      border-radius: 100%;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
      transition: width 0.25s ease-in-out, height 0.25s ease-in-out;
    }

    &:hover {
      border: 2px solid $color-white;

      &:after {
        width: 0.5rem;
        height: 0.5rem;
      }
    }
  }
</style>

<div class="pointer" style={`left: ${x}%; top: ${y}%`} />
