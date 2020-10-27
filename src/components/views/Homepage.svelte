<script>
  import Title from "../atoms/Title.svelte";
  import Section from "../atoms/Section.svelte";
  import Rule from "../atoms/Rule.svelte";
  import ImageCard from "../molecules/ImageCard.svelte";
  import ProductCard from "../molecules/ProductCard.svelte";
  import Button from "../atoms/Button.svelte";
  import Card from "../atoms/Card.svelte";
  import SectionText from "../atoms/SectionText.svelte";
  import Link from "../atoms/Link.svelte";
  import SeeMoreCard from "../molecules/SeeMoreCard.svelte";
  import ImagePointer from "../atoms/ImagePointer.svelte";
  import ImageOverlay from "../atoms/ImageOverlay.svelte";
</script>

<style type="text/scss">
</style>

<Section>
  <Title>Make moments to treasure</Title>
  <!-- <ProductCard
    news
    family
    title="STRÅLA"
    productType="Lamp shade"
    regularPrice={13}
    price={11} />
  <ProductCard
    news
    title="VINTER 2020"
    productType="Decoration bauble..."
    price={9}
    pieces={32} /> -->
  <ImageCard src="images/photos/festive-baking.jpg" left={10}>
    <SeeMoreCard style="position: absolute; bottom: 1rem; left: 1rem;">
      See more cookware & tableware
    </SeeMoreCard>
  </ImageCard>
  <Rule />
</Section>
<Section>
  <Card
    style="display: grid; grid-template-columns: 1fr auto; align-items: flex-start;">
    <Title>See our products in real homes <br /> @ikeauk</Title>
    <Button href="#">View more</Button>
  </Card>
  <p>Slideshow goes here</p>
  <Rule />
</Section>
<Section>
  <Title type="h2">Illuminate your home with Christmas decorations</Title>
  <SectionText>
    From paper lampshades to fairy lights and colourful baubles, here’s
    everything you need to create a festive feel.
  </SectionText>
  <ImageCard src="images/photos/strala-lights.jpg">
    <ImageOverlay>
      <ImagePointer x={20} y={20} />
      <ImagePointer x={24} y={38} />
      <ImagePointer x={74} y={26} />
      <ImagePointer x={72} y={65} />
    </ImageOverlay>
  </ImageCard>
  <ImageCard src="images/photos/christmas-decor.jpg">
    <ImageOverlay>
      <ImagePointer x={41} y={33} />
      <ImagePointer x={55} y={40} />
      <ImagePointer x={25} y={75} />
    </ImageOverlay>
  </ImageCard>
  <Link style="display: grid; margin: 1.25rem 0 1rem 0;" icon>
    See all products for Christmas
  </Link>
  <Rule />
</Section>
