<script>
  export let type = "h1";
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  h1 {
    margin-bottom: 2rem;
    font-size: 1.125rem;
    line-height: 1.44444;
    font-weight: 700;
    color: $color-gray-900;
  }
  h2 {
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
    line-height: 1.44444;
    font-weight: 700;
    color: $color-gray-900;
  }
  // h3 {
  // }
  h4 {
    font-size: 0.875rem;
    line-height: 1.5;
    font-weight: 700;
    color: $color-gray-900;
  }
  // h5 {
  // }
  // h6 {
  // }
</style>

{#if type === 'h1'}
  <h1>
    <slot />
  </h1>
{:else if type === 'h2'}
  <h2>
    <slot />
  </h2>
{:else if type === 'h3'}
  <h3>
    <slot />
  </h3>
{:else if type === 'h4'}
  <h4>
    <slot />
  </h4>
{:else if type === 'h5'}
  <h5>
    <slot />
  </h5>
{:else if type === 'h6'}
  <h6>
    <slot />
  </h6>
{/if}
