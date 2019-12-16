using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Dostavochka.Entities
{
    public class Order_Product
    {
        [Key]
        public int EntryId { get; set; }
        [Required]
        public int OrderId { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public int Count { get; set; }
        [Required]
        public byte Unit { get; set; }
        [Required]
        public decimal Budget { get; set; }
        [Required]
        public int ProductId { get; set; }
    }
}
