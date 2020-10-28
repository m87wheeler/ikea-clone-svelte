<script>
  export let available = false;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .dot {
    display: inline-block;
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 100%;
    background: $color-red;

    &--available {
      background: $color-green;
    }
  }
</style>

<span class="dot" class:dot--available={available} />
