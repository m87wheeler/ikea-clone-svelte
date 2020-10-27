<script>
  import Button from "../atoms/Button.svelte";
  import Card from "../atoms/Card.svelte";
  import Title from "../atoms/Title.svelte";

  export let title;
  export let buttonText;
  export let price;
</script>

<style type="text/scss">
  @import "../../style/Theme.scss";

  .container {
    width: 100%;
    padding: 2.5rem 2.5rem 3.75rem;
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;

    p {
      display: block;
      margin-bottom: 0.625rem;
      font-size: 0.875rem;
      line-height: 1.7142;
    }
  }
</style>

<Card style="width: 100%; margin-top: -.5rem; background: #f5f5f5;">
  <div class="container">
    <Title type="h2">{title}</Title>
    <slot>
      <p>{price}</p>
    </slot>
    <Button style="margin-top: 1.5rem;" secondary>{buttonText}</Button>
  </div>
</Card>
