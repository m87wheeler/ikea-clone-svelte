<script>
  import HoverCard from "../organisms/HoverCard.svelte";

  export let data = [];
  let allHidden = false;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .overlay {
    @include no-select;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>

<div
  class="overlay"
  on:mouseenter={() => (allHidden = true)}
  on:mouseleave={() => (allHidden = false)}>
  {#each data as product}
    <HoverCard
      visible={allHidden ? false : product.visible}
      x={product.x}
      y={product.y}
      position={product.position}
      news={product.news}
      family={product.family}
      title={product.title}
      artno={product.artno}
      productType={product.productType}
      regularPrice={product.regularPrice}
      price={product.price}
      pieces={product.pieces}
      on:productview />
  {/each}
</div>
