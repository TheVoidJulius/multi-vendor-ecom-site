import Layout from "@/components/layout/Layout";

export default function About() {
  return (
    <Layout>
      <div className="container-premium py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-display text-foreground mb-6">About Veloura</h1>
          <p className="text-body-large mb-12">
            We're building the future of online shopping — a curated destination where the world's most iconic brands come together under one premium experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-8">
            <div className="text-4xl font-semibold text-foreground mb-2">50+</div>
            <p className="text-sm text-muted-foreground">Premium Brands</p>
          </div>
          <div className="text-center p-8">
            <div className="text-4xl font-semibold text-foreground mb-2">10K+</div>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="text-center p-8">
            <div className="text-4xl font-semibold text-foreground mb-2">1M+</div>
            <p className="text-sm text-muted-foreground">Happy Customers</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-20 space-y-8">
          <div>
            <h2 className="text-title text-foreground mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To make premium products accessible to everyone through a seamless, personalized shopping experience that puts quality and design at the forefront.
            </p>
          </div>
          <div>
            <h2 className="text-title text-foreground mb-3">Our Promise</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every product on Veloura is authenticated and sourced directly from brands and verified vendors. We guarantee quality, fast shipping, and hassle-free returns.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
