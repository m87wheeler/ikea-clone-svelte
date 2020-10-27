<script>
  export let style = "";
  export let ref = "";
  export let shadow = false;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .card {
    display: inline-block;
    padding: 1rem;
    background: $color-white;

    &--shadow {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
    }
  }
</style>

<div {ref} class={`card ${shadow && 'card--shadow'}`} {style}>
  <slot />
</div>
