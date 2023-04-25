module Jekyll
    module ExtractQuantityFilter
      def extract_quantity(input)
        match = input.match(/^(\d+\.?\d*|\d*\.?\d+)\s*(.*)$/)
        if match
          [match[1], match[2]]
        else
          [nil, input]
        end
      end
    end
  end

  Liquid::Template.register_filter(Jekyll::ExtractQuantityFilter)
