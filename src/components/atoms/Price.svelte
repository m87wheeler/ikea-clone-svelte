<script>
  import { formatPrice } from "../../assets/functions";

  export let price;
  export let small = false;

  let formatted = formatPrice(price, "obj");
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .price {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.875;

    .currency {
      margin-right: -0.2rem;
      font-size: 0.65rem;
      vertical-align: super;
      font-weight: 900;
    }

    .pence {
      margin-left: -0.2rem;
      font-size: 0.65rem;
      vertical-align: super;
      font-weight: 900;
    }

    &--small {
      font-size: 0.625rem;
    }
  }
</style>

<p class="price" class:price--small={small}>
  <span class="currency">£</span>
  <span class="pounds">{formatted.pounds}</span>
  {#if formatted.pence}<span class="pence">.{formatted.pence}</span>{/if}
</p>
