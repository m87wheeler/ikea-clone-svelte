<script>
  import Title from "../atoms/Title.svelte";
  import Section from "../atoms/Section.svelte";
  import Rule from "../atoms/Rule.svelte";
  import ImageCard from "../molecules/ImageCard.svelte";
  import Button from "../atoms/Button.svelte";
  import Card from "../atoms/Card.svelte";
  import SectionText from "../atoms/SectionText.svelte";
  import Link from "../atoms/Link.svelte";
  import SeeMoreCard from "../molecules/SeeMoreCard.svelte";
  import ImageOverlay from "../atoms/ImageOverlay.svelte";
  import HoverCard from "../organisms/HoverCard.svelte";

  import { productData } from "./productData";
  import LargeProductCard from "../molecules/LargeProductCard.svelte";
</script>

<style type="text/scss">
</style>

<Section>
  <Title>Make moments to treasure</Title>
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
      {#each productData[0] as product}
        <HoverCard
          x={product.x}
          y={product.y}
          position={product.position}
          news={product.news}
          family={product.family}
          title={product.title}
          productType={product.productType}
          regularPrice={product.regularPrice}
          price={product.price}
          pieces={product.pieces} />
      {/each}
    </ImageOverlay>
  </ImageCard>
  <ImageCard src="images/photos/christmas-decor.jpg">
    <ImageOverlay>
      {#each productData[1] as product}
        <HoverCard
          x={product.x}
          y={product.y}
          position={product.position}
          news={product.news}
          family={product.family}
          title={product.title}
          productType={product.productType}
          regularPrice={product.regularPrice}
          price={product.price}
          pieces={product.pieces} />
      {/each}
    </ImageOverlay>
  </ImageCard>
  <Link style="display: grid; margin: 1.25rem 0 1rem 0;" icon>
    See all products for Christmas
  </Link>
  <Rule />
</Section>
<Section>
  <Title>New lower prices, same great quality</Title>
  <ImageCard src="images/photos/fabrikor-cabinets.webp" />
  <LargeProductCard
    title="FABRIKÖR Glass door cabinet"
    buttonText="Browse our new lower prices">
    <p
      style="
    margin-bottom: 0.625rem;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.7142;">
      Now £129
    </p>
    <p
      style="
  margin-bottom: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.7142;">
      Was £150
    </p>
  </LargeProductCard>
  <Rule />
</Section>
