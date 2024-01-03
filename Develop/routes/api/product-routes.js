const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    // find all products
    const productsData = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag, as: 'tags' },
      ],
    });
    res.status(200).json(productsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try {
    // find a single product by its `id`
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag, as: 'tags' },
      ],
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id' });
      return;
    }

    res.status(200).json(productData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get the product' });
  }
});

// create new product
router.post('/', async (req, res) => {
  try {
    /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
    */
    const newProduct = await Product.create(req.body);

    // if there are product tags, create pairings in the ProductTag model
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => ({
        product_id: newProduct.id,
        tag_id,
      }));

      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

// update product
router.put('/:id', async (req, res) => {
  try {
    // update product data
    const [updatedRowCount] = await Product.update(req.body, {
      where: { id: req.params.id },
    });

    if (updatedRowCount === 0) {
      res.status(404).json({ message: 'No product found with this id' });
      return;
    }

    // if there are product tags, update pairings in the ProductTag model
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagsToRemove = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });

      const productTagIdsToRemove = productTagsToRemove
        .map(({ tag_id }) => tag_id)
        .filter((tag_id) => !req.body.tagIds.includes(tag_id));

      await ProductTag.destroy({ where: { id: productTagIdsToRemove } });

      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagsToRemove.map(({ tag_id }) => tag_id).includes(tag_id))
        .map((tag_id) => ({ product_id: req.params.id, tag_id }));

      await ProductTag.bulkCreate(newProductTags);
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // delete one product by its `id` value
    const deletedRowCount = await Product.destroy({
      where: { id: req.params.id },
    });

    if (deletedRowCount === 0) {
      res.status(404).json({ message: 'No product found with this id' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
