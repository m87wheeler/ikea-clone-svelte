<script>
  import ImagePointer from "../atoms/ImagePointer.svelte";
  import ProductCard from "../molecules/ProductCard.svelte";

  // ProductCard props
  export let news = false;
  export let family = false;
  export let href = "";
  export let title = "";
  export let productType = "";
  export let regularPrice = 0;
  export let price = 0;
  export let pieces = 0;
  export let visible = false;
  // HoverCard props
  export let x = 0;
  export let y = 0;
  export let position = "top left";

  // position of pointer based on position props
  let layout = {
    pointer: "grid-column: 1 / 2; align-self: flex-start",
    card: "",
  };
  switch (position) {
    case "top":
      layout = {
        pointer: "grid-column: 1 / 3; grid-row: 1 / 2; justify-self: center;",
        card: "grid-column: 1 / 3; grid-row: 2 / 3;",
      };
      break;
    case "bottom":
      layout = {
        pointer: "grid-column: 1 / 3; grid-row: 2 / 3; justify-self: center;",
        card: "grid-column: 1 / 3; grid-row: 1 / 2;",
      };
      break;
    case "left":
      layout = {
        pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: center;",
        card: "grid-column: 2 / 3; grid-row: 1 / 3; ",
      };
      break;
    case "right":
      layout = {
        pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: center;",
        card: "grid-column: 1 / 2; grid-row: 1/ 3;",
      };
      break;
    case "top right":
      layout = {
        pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: flex-start;",
        card: "grid-column: 1 / 2; grid-row: 1/ 3;",
      };
      break;
    case "bottom left":
      layout = {
        pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: flex-end;",
        card: "grid-column: 2 / 3; grid-row: 1 / 3; ",
      };
      break;
    case "bottom right":
      layout = {
        pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: flex-end;",
        card: "grid-column: 1 / 2; grid-row: 1/ 3;",
      };
      break;
    default:
      layout = {
        pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: flex-start;",
        card: "grid-column: 2 / 3; grid-row: 1 / 3; ",
      };
      break;
  }

  // toggle card visibility on hover
  const revealCard = () => (visible = true);
  const hideCard = () => (visible = false);
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    grid-gap: 0.5rem;

    &__pointer {
      position: relative;
      z-index: 10;
    }

    &__card {
      position: relative;
      opacity: 0;
      transition: opacity 0.3s ease-in-out, z-index 0.3s ease-in-out;
      z-index: 1;

      &--visible {
        opacity: 1;
        z-index: 25;
      }
    }
  }
</style>

<div
  class="container"
  style={`top: ${y}%; left: ${x}%`}
  on:mouseleave={hideCard}>
  <div class="container__pointer" style={layout.pointer}>
    <ImagePointer on:mouseenter={revealCard} />
  </div>
  <div
    class={`container__card ${visible && 'container__card--visible'}`}
    style={layout.card}>
    <ProductCard
      {news}
      {family}
      {href}
      {title}
      {productType}
      {regularPrice}
      {price}
      {pieces} />
  </div>
</div>
