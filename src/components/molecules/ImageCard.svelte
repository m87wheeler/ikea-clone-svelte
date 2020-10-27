<script>
  import { propTypes } from "../../assets/PropTypes";

  import Card from "../atoms/Card.svelte";

  export let src = "";
  export let top = 50;
  export let left = 50;
  export let orientation = "portrait";
  export let aspectRatio = "4:3";

  propTypes(src, "string");
  propTypes(top, "number");
  propTypes(left, "number");
  propTypes(orientation, ["portrait", "landscape"]);
  propTypes(aspectRatio, ["16:9", "4:3", "1:1"]);

  let style;
  if (aspectRatio === "16:9") {
    orientation === "portrait"
      ? (style = "padding-bottom: 177.78%;")
      : (style = "padding-bottom: 56.25%;");
  } else if (aspectRatio === "4:3") {
    orientation === "portrait"
      ? (style = "padding-bottom: 133%;")
      : (style = "padding-bottom: 75%;");
  } else if (aspectRatio === "1:1") {
    style = "padding-bottom: 100%;";
  }
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  :global([ref="image-card"]) {
    position: relative;
    width: 100%;
    height: 0;
    margin: 0.25rem 0;
    background-color: #c4c4c4 !important;
    overflow: hidden;
  }

  .image {
    position: absolute;
    max-height: 100%;
    transform: translateX(-50%) translateY(-50%);
  }
</style>

<Card ref="image-card" style={` ${style}`}>
  <img class="image" {src} alt="" style={`top: ${top}%; left: ${left}%;`} />
  <slot />
</Card>
